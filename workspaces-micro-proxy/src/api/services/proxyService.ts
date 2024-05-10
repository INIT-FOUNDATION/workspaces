import {
  envUtils,
  loggerUtils,
  mongoUtils,
} from "workspaces-micro-commons";
import { IImage, IParticipant, ISession } from "../../types/custom";
import { IMAGES_STATUS, SESSIONS_STATUS } from "../../constants";
import { ImageModel } from "../../models/imagesModel";
import { ParticipantModel } from "../../models/participantsModel";
import { SessionModel } from "../../models/sessionsModel";
import Docker, { ContainerCreateOptions } from "dockerode";
const docker = new Docker({
  socketPath: envUtils.getStringEnvVariableOrDefault("WORKSPACES_DOCKER_SOCKET", "/var/run/docker.sock")
})
const environment = envUtils.getStringEnvVariableOrDefault("NODE_ENV", "DEV");

export const proxyService = {
  createProxy: async (proxyDetails: any) => {
    try {
      const images: IImage[] = await proxyService.getImageById(proxyDetails.imageId);
      const image: IImage = images[0];

      const sessions: ISession[] = await proxyService.getSessionById(proxyDetails.sessionId);
      const session: ISession = sessions[0];

      const createOptions: ContainerCreateOptions = {
        name: session.sessionId,
        HostConfig: {
          PortBindings: {},
          SecurityOpt: ['seccomp=unconfined'],
          ShmSize: session.sharedMemory,
          RestartPolicy: { Name: 'always' },
          Devices: [{ PathOnHost: '/dev/snd', PathInContainer: '/dev/snd', CgroupPermissions: 'rwm' }],
          Mounts: [
            {
              Type: 'volume',
              Source: session.sessionId,
              Target: '/config'
            }
          ]
        },
        Env: [
          'PUID=1000',
          'PGID=1000',
          `TZ=${session.timezone}`,
          `FIREFOX_CLI=${session.startUrl}`
        ],
        Image: `${image.imageRepo}:${image.imageTag}`
      };

      if (environment === "DEV" && createOptions.HostConfig) {
        createOptions.HostConfig.PortBindings = {
          '3000/tcp': [{ HostPort: '3000' }],
          '3001/tcp': [{ HostPort: '3001' }]
        };
      }

      const container = await docker.createContainer(createOptions);
      await container.start();

    } catch (error) {
      loggerUtils.error(`proxyService :: createProxy :: proxyDetails ${JSON.stringify(proxyDetails)} :: ${error}`);
      throw error;
    }
  },
  getImageById: async (imageId: string): Promise<IImage[]> => {
    try {
      const images: IImage[] = await mongoUtils.findDocumentsWithOptions<IImage>(ImageModel, {
        imageId,
        isActive: IMAGES_STATUS.ACTIVE
      }, {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        isActive: 0
      }, {
      });
      return images;
    } catch (error) {
      loggerUtils.error(`proxyService :: getImageById :: imageId ${imageId} :: ${error}`);
      throw error;
    }
  },
  participantExistsById: async (participantId: string): Promise<boolean> => {
    try {
      const exists = await mongoUtils.existsDocument<IParticipant>(ParticipantModel, {
        participantId
      });
      return exists
    } catch (error) {
      loggerUtils.error(`proxyService :: participantExistsById :: participantId ${participantId} :: ${error}`);
      throw error;
    }
  },
  getParticipantById: async (participantId: string): Promise<IParticipant[]> => {
    try {
      const participant: IParticipant[] = await mongoUtils.findDocumentsWithOptions<IParticipant>(ParticipantModel, {
        participantId
      }, {
        _id: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0
      }, {

      });
      return participant
    } catch (error) {
      loggerUtils.error(`proxyService :: getParticipantById :: participantId ${participantId} :: ${error}`);
      throw error;
    }
  },
  getSessionById: async (sessionId: string): Promise<ISession[]> => {
    try {
      const sessions: ISession[] = await mongoUtils.findDocumentsWithOptions<ISession>(SessionModel, {
        sessionId,
        status: SESSIONS_STATUS.ACTIVE
      }, {
        _id: 0,
        __v: 0,
        clientId: 0,
        createdAt: 0,
        updatedAt: 0,
        status: 0
      }, {

      });
      return sessions;
    } catch (error) {
      loggerUtils.error(`proxyService :: getSessionById :: sessionId ${sessionId} :: ${error}`);
      throw error;
    }
  },
  sessionExistsById: async (sessionId: string) => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<ISession>(SessionModel, {
        sessionId,
        status: SESSIONS_STATUS.ACTIVE
      });
      return exists;
    } catch (error) {
      loggerUtils.error(`proxyService :: sessionExistsById by sessionId ${sessionId} :: ${error}`);
      throw error;
    }
  },
  imageExistsById: async (imageId: string): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IImage>(ImageModel, {
        imageId,
        isActive: IMAGES_STATUS.ACTIVE
      });
      return exists;
    } catch (error) {
      loggerUtils.error(`proxyService :: imageExistsById :: imageId ${imageId} :: ${error}`);
      throw error;
    }
  },
  destroyProxy: async (proxyDetails: any) => {
    try {
      const container = await proxyService.getContainerByName(proxyDetails.sessionId);
      if (container) {
        container.stop()
        container.remove()
      }

      await mongoUtils.updateDocuments<ISession>(SessionModel, {
        sessionId: proxyDetails.sessionId
      }, {
        status: SESSIONS_STATUS.INACTIVE
      })

      if (proxyDetails.deletePersistence) {
        const volume = await docker.getVolume(proxyDetails.sessionId);
        if (volume) volume.remove()
      }


    } catch (error) {
      loggerUtils.error(`proxyService :: destroyProxy :: proxyDetails ${JSON.stringify(proxyDetails)} :: ${error}`);
      throw error;
    }
  },
  getContainerByName: async (containerName: string) => {
    try {
      const containers = await docker.listContainers();
      for (const container of containers) {
        const containerNames = await container.Names;
        if (containerNames.includes(containerName)) {
          return docker.getContainer(container.Id);
        }
      }
      return null;
    } catch (error) {
      loggerUtils.error(`proxyService :: getContainerByName :: containerName ${containerName} :: ${error}`);
      return null;
    }
  }
};
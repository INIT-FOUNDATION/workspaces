import { CACHE_TTL, MONGO_COLLECTIONS, envUtils, loggerUtils, mongoUtils, nodeCacheUtils } from "workspaces-micro-commons";
import { IImage, IParticipant, ISession } from "../../types/custom";
import { IMAGES_STATUS, SESSIONS_STATUS } from "../../constants";
import { ImageModel } from "../../models/imagesModel";
import { ParticipantModel } from "../../models/participantsModel";
import { SessionModel } from "../../models/sessionsModel";
import Docker, { Container, ContainerCreateOptions } from "dockerode";

const environment = envUtils.getStringEnvVariableOrDefault(
  "NODE_ENV",
  "Development"
);

export const proxyService = {
  createProxy: async (proxyDetails: any) => {
    try {
      const soundDevice = await proxyService.getSoundDevice();
      const docker = await proxyService.getDockerClient();
      const images: IImage[] = await proxyService.getImageById(
        proxyDetails.imageId
      );
      const image: IImage = images[0];

      const containerSessionExists = await proxyService.dockerContainerExistsByName(proxyDetails.sessionId);
      if (!containerSessionExists) {
        const autoRemoval = envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_PROXY_CONTAINERS_AUTO_REMOVE", true);
        const networkName = envUtils.getStringEnvVariableOrDefault("WORKSPACES_PROXY_CONTAINERS_NETWORK", "workspaces-proxy-network");

        await proxyService.ensureNetworkExists(networkName);

        const createOptions: ContainerCreateOptions = {
          name: proxyDetails.sessionId,
          HostConfig: {
            PortBindings: {},
            SecurityOpt: ["seccomp=unconfined"],
            ShmSize: proxyDetails.sharedMemory,
            RestartPolicy: { Name: autoRemoval ? "no" : "yes" },
            NetworkMode: networkName,
            AutoRemove: autoRemoval,
            Devices: [
              {
                PathOnHost: soundDevice,
                PathInContainer: soundDevice,
                CgroupPermissions: "rwm",
              },
            ],
            Mounts: [],
          },
          Env: image.defaultEnvs && image.defaultEnvs.length > 0 ? image.defaultEnvs.map(env => env.replace(envUtils.getStringEnvVariableOrDefault("WORKSPACES_START_URL_DB_PLACEHOLDER", "workspaces-start-url"), proxyDetails.startUrl)): [],
          Image: `${image.imageRepo}:${image.imageTag}`,
        };

        if (environment === "Development" && createOptions.HostConfig && image.runningPorts) {
          createOptions.HostConfig.PortBindings = image.runningPorts.reduce((bindings, port) => {
            const key = `${port.port}/${port.protocol}`;
            (bindings as { [key: string]: { HostPort: string }[] })[key] = [{ HostPort: port.port.toString() }];
            return bindings;
          }, {});
        }

        if (proxyDetails.saveSession && image.volumeMountPath)
          createOptions.HostConfig?.Mounts?.push({
            Type: "volume",
            Source: proxyDetails.sessionId,
            Target: image.volumeMountPath,
          });

        const container = await docker.createContainer(createOptions);
        await container.start();

        const sessionExists: boolean = await proxyService.sessionExistsById(proxyDetails.sessionId);

        if (!sessionExists) {
          const sessionObj: Partial<ISession> = {
            sessionId: proxyDetails.sessionId,
            clientId: proxyDetails.clientId,
            agentId: proxyDetails.agentId,
            timezone: proxyDetails.timezone,
            startUrl: proxyDetails.startUrl,
            participantsAccess: proxyDetails.participantsAccess,
            drawCursors: proxyDetails.drawCursors,
            sharedMemory: proxyDetails.sharedMemory,
            saveSession: proxyDetails.saveSession,
            imageId: proxyDetails.imageId,
            status: proxyDetails.status,
          };
          await mongoUtils.insertDocument<ISession>(SessionModel, sessionObj);
        }
      }
    } catch (error) {
      loggerUtils.error(
        `proxyService :: createProxy :: proxyDetails ${JSON.stringify(
          proxyDetails
        )} :: ${error}`
      );
      throw error;
    }
  },
  getImageById: async (imageId: string): Promise<IImage[]> => {
    try {
      const images: IImage[] =
        await mongoUtils.findDocumentsWithOptions<IImage>(
          ImageModel,
          {
            imageId,
            isActive: IMAGES_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            isActive: 0,
          },
          {}
        );
      return images;
    } catch (error) {
      loggerUtils.error(
        `proxyService :: getImageById :: imageId ${imageId} :: ${error}`
      );
      throw error;
    }
  },
  participantExistsById: async (participantId: string): Promise<boolean> => {
    try {
      const exists = await mongoUtils.existsDocument<IParticipant>(
        ParticipantModel,
        {
          participantId,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `proxyService :: participantExistsById :: participantId ${participantId} :: ${error}`
      );
      throw error;
    }
  },
  getParticipantById: async (
    participantId: string
  ): Promise<IParticipant[]> => {
    try {
      const participant: IParticipant[] =
        await mongoUtils.findDocumentsWithOptions<IParticipant>(
          ParticipantModel,
          {
            participantId,
          },
          {
            _id: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
          },
          {}
        );
      return participant;
    } catch (error) {
      loggerUtils.error(
        `proxyService :: getParticipantById :: participantId ${participantId} :: ${error}`
      );
      throw error;
    }
  },
  getSessionById: async (sessionId: string): Promise<ISession[]> => {
    try {
      const sessions: ISession[] =
        await mongoUtils.findDocumentsWithOptions<ISession>(
          SessionModel,
          {
            sessionId,
            status: SESSIONS_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            clientId: 0,
            createdAt: 0,
            updatedAt: 0,
            status: 0,
          },
          {}
        );
      return sessions;
    } catch (error) {
      loggerUtils.error(
        `proxyService :: getSessionById :: sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
  sessionExistsById: async (sessionId: string) => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<ISession>(
        SessionModel,
        {
          sessionId,
          status: SESSIONS_STATUS.ACTIVE,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `proxyService :: sessionExistsById by sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
  imageExistsById: async (imageId: string): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IImage>(
        ImageModel,
        {
          imageId,
          isActive: IMAGES_STATUS.ACTIVE,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `proxyService :: imageExistsById :: imageId ${imageId} :: ${error}`
      );
      throw error;
    }
  },
  listImages: async (): Promise<IImage[]> => {
    try {
      const images: IImage[] =
        await mongoUtils.findDocumentsWithOptions<IImage>(
          ImageModel,
          {
            isActive: IMAGES_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          },
          {}
        );
      return images;
    } catch (error) {
      loggerUtils.error(`proxyService :: listImages :: ${error}`);
      throw error;
    }
  },
  destroyProxy: async (proxyDetails: any) => {
    try {
      const docker = await proxyService.getDockerClient();
      const container = await proxyService.getContainerByName(
        proxyDetails.sessionId
      );

      if (container) {
        await container.stop();
        const autoRemoval = envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_PROXY_CONTAINERS_AUTO_REMOVE", true);
        if (!autoRemoval)
          await container.remove();
      }

      await mongoUtils.updateDocuments<ISession>(
        SessionModel,
        {
          sessionId: proxyDetails.sessionId,
        },
        {
          status: proxyDetails.deletePersistence ? SESSIONS_STATUS.DELETED : SESSIONS_STATUS.INACTIVE,
        }
      );

      if (proxyDetails.deletePersistence) {
        const volume = await docker.getVolume(proxyDetails.sessionId);
        if (volume) volume.remove();
      }
    } catch (error) {
      loggerUtils.error(
        `proxyService :: destroyProxy :: proxyDetails ${JSON.stringify(
          proxyDetails
        )} :: ${error}`
      );
      throw error;
    }
  },
  getContainerByName: async (containerName: string) => {
    try {
      const docker = await proxyService.getDockerClient();
      const containers = await docker.listContainers();
      for (const container of containers) {
        const containerNames = await container.Names;
        if (containerNames.includes(`/${containerName}`)) {
          return docker.getContainer(container.Id);
        }
      }
      return null;
    } catch (error) {
      loggerUtils.error(
        `proxyService :: getContainerByName :: containerName ${containerName} :: ${error}`
      );
      return null;
    }
  },
  getDockerClient: async (): Promise<Docker> => {
    try {
      const docker: Docker = new Docker({
        socketPath: envUtils.getStringEnvVariableOrDefault(
          "WORKSPACES_DOCKER_SOCKET",
          "/var/run/docker.sock"
        ),
      });
      return docker;
    } catch (error) {
      loggerUtils.error(`proxyService :: getDockerClient :: ${error}`);
      throw error;
    }
  },
  getSoundDevice: (): string =>
    envUtils.getStringEnvVariableOrDefault(
      "WORKSPACES_DEFAULT_SOUND_DEVICE",
      "/dev/snd"
    ),
  pullAvailableImages: async () => {
    try {
      loggerUtils.info(
        `proxyService :: pullAvailableImages :: pulling available images`
      );

      const docker: Docker = await proxyService.getDockerClient();
      const images = await proxyService.listImages();

      for (const image of images) {
        const imageName: string = `${image.imageRepo}:${image.imageTag}`;
        loggerUtils.info(
          `proxyService :: pullAvailableImages :: pulling image :: ${imageName}`
        );

        if (image.registryHost && image.registryUsername && image.registryPassword) {
          await docker.checkAuth({
            username: image.registryUsername,
            password: image.registryPassword,
            serveraddress: `https://${image.registryHost}`
          })
        }
        await docker.pull(imageName);
      }

      return docker;
    } catch (error) {
      loggerUtils.error(`proxyService :: getDockerClient :: ${error}`);
      throw error;
    }
  },
  dockerContainerExistsByName: async (containerName: string): Promise<boolean> => {
    try {
      const docker = await proxyService.getDockerClient();
      const containers = await docker.listContainers();
      for (const container of containers) {
        const containerNames = await container.Names;
        if (containerNames.includes(`/${containerName}`)) {
          return true;
        }
      }
      return false;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      } else {
        loggerUtils.error(`proxyService :: getDockerClient :: ${error}`);
        throw error;
      }
    }
  },
  ensureNetworkExists: async (networkName: string): Promise<boolean> => {
    try {
      const docker: Docker = await proxyService.getDockerClient();
      const networks = await docker.listNetworks();
      const networkExists = networks.some(network => network.Name === networkName);

      if (networkExists) {
        loggerUtils.info(`proxyService :: ensureNetworkExists :: Network with name ${networkName} already exists.`);
        return true;
      } else {
        await docker.createNetwork({
          Name: networkName,
          CheckDuplicate: true,
          Driver: 'bridge',
        });
        loggerUtils.info(`proxyService :: ensureNetworkExists :: Network with name ${networkName} created successfully.`);
        return true;
      }
    } catch (error: any) {
      loggerUtils.error(`Error ensuring network exists with name ${networkName}: ${error.message}`);
      throw error;
    }
  },
  getImageDetailsBySessionId: async (sessionId: string): Promise<IImage> => {
    try {
      const key = `SESSION_IMAGE|${sessionId}`;
      const cachedData: any = await nodeCacheUtils.getKey(key);
      
      if (cachedData) return cachedData;

      const pipeline = [
        {
          $match: { status: SESSIONS_STATUS.ACTIVE, sessionId },
        },
        {
          $lookup: {
            from: MONGO_COLLECTIONS.IMAGES,
            let: { imageId: "$imageId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$imageId", "$$imageId"] },
                      { $eq: ["$isActive", IMAGES_STATUS.ACTIVE] },
                    ],
                  },
                },
              },
            ],
            as: MONGO_COLLECTIONS.IMAGES,
          },
        },
        {
          $unwind: `$${MONGO_COLLECTIONS.IMAGES}`
        },
        {
          $replaceRoot: { newRoot: `$${MONGO_COLLECTIONS.IMAGES}` }
        },
        {
          $project: {
            _id: 0,
            imageId: 1,
            runningPorts: 1
          }
        }
      ];

      const images: IImage[] = await mongoUtils.aggregateDocuments<ISession>(
        SessionModel,
        pipeline
      );

      if (images.length > 0) {
        await nodeCacheUtils.setKey(key, images[0], CACHE_TTL.ONE_HOUR);
      }

      return images[0];
    } catch (error) {
      loggerUtils.error(
        `proxyService :: getImageDetailsBySessionId :: sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
};

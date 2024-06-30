import { CACHE_TTL, MONGO_COLLECTIONS, envUtils, loggerUtils, mongoUtils, nodeCacheUtils, redisUtils } from "workspaces-micro-commons";
import { IAgent, IImage, IParticipant, ISession } from "../../types/custom";
import { AGENTS_STATUS, IMAGES_STATUS, SESSIONS_STATUS } from "../../constants";
import { ImageModel } from "../../models/imagesModel";
import { ParticipantModel } from "../../models/participantsModel";
import { SessionModel } from "../../models/sessionsModel";
import Docker, { ContainerCreateOptions } from "dockerode";
import { AgentModel } from "../../models/agentsModel";

export const proxyService = {
  createProxy: async (proxyDetails: any) => {
    try {
      const docker = await proxyService.getDockerClient();
      const images: IImage[] = await proxyService.getImageById(
        proxyDetails.imageId
      );
      const image: IImage = images[0];

      const containerSessionExists = await proxyService.dockerContainerExistsByName(proxyDetails.sessionId);
      if (!containerSessionExists) {
        const autoRemoval = envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_PROXY_CONTAINERS_AUTO_REMOVE", true);
        const networkName = envUtils.getStringEnvVariableOrDefault("WORKSPACES_PROXY_CONTAINERS_NETWORK", "workspaces-proxy-network");
        const openPorts = proxyDetails.tcpPort && proxyDetails.udpPort;

        await proxyService.ensureNetworkExists(networkName);

        const defaultEnvs = [
          `NEKO_PASSWORD=${proxyDetails.userPassword}`,
          `NEKO_PASSWORD_ADMIN=${proxyDetails.adminPassword}`,
          `START_URL=${proxyDetails.startUrl}`,
          `DARK_MODE=${proxyDetails.darkMode ? '--force-dark-mode' : '--disable-features=DarkMode'}`,
        ]

        if (envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_ENABLE_TURN_SUPPORT", false)) {
          const iceServers = [
            {
              "urls": ["stun:turn.orrizonte.in"]
            },
            {
              "urls": [
                "turn:turn.orrizonte.in"
              ],
              "username": "a8z7G3p9F1s6",
              "credential": "bmS8QSeG7SHwPLSo"
            }
          ]
          const iceServersString = envUtils.getStringEnvVariableOrDefault("WORKSPACES_TURN_SERVERS", JSON.stringify(iceServers))
          defaultEnvs.push(`NEKO_ICESERVERS=${iceServersString}`)

          const parsedIceServers = JSON.parse(iceServersString);
          const iceServer: string = parsedIceServers.flatMap((server: any) => server.urls).find((url: string) => url.startsWith("stun:")) || '';
          defaultEnvs.push(`NEKO_ICESERVER=${iceServer}`)
        }

        if (openPorts) {
          defaultEnvs.push(`NEKO_BIND=:${proxyDetails.tcpPort}`, `NEKO_UDPMUX=${proxyDetails.udpPort}`);
        }

        const createOptions: ContainerCreateOptions = {
          name: proxyDetails.sessionId,
          ExposedPorts: {},
          HostConfig: {
            CapAdd: ['SYS_ADMIN'],
            PortBindings: {},
            ShmSize: proxyDetails.sharedMemory,
            RestartPolicy: { Name: autoRemoval ? "no" : "yes" },
            NetworkMode: networkName,
            AutoRemove: autoRemoval,
            Mounts: [],
          },
          Env: image.defaultEnvs && image.defaultEnvs.length > 0 ? [...image.defaultEnvs, ...defaultEnvs] : defaultEnvs,
          Image: `${image.imageRepo}:${image.imageTag}`,
        };

        if (openPorts) {
          const agentSSLCertPath = envUtils.getStringEnvVariableOrDefault("WORKSPACES_AGENT_SSL_CERT_PATH", "/etc/letsencrypt/live/example.com/fullchain.pem")
          const agentSSLKeyPath = envUtils.getStringEnvVariableOrDefault("WORKSPACES_AGENT_SSL_KEY_PATH", "/etc/letsencrypt/live/example.com/privkey.pem")
          const proxySSLCertPath = envUtils.getStringEnvVariableOrDefault("WORKSPACES_PROXY_SSL_KEY_PATH", "/app/fullchain.pem")
          const proxySSLKeyPath = envUtils.getStringEnvVariableOrDefault("WORKSPACES_PROXY_SSL_KEY_PATH", "/app/privkey.pem")

          if (createOptions.Env && createOptions.Env.length > 0) {
            createOptions.Env.push(
              `NEKO_CERT=${proxySSLCertPath}`,
              `NEKO_KEY=${proxySSLKeyPath}`
            )
          }

          if (createOptions.HostConfig?.Mounts) {
            createOptions.HostConfig?.Mounts?.push({
              Type: "bind",
              Source: agentSSLCertPath,
              Target: proxySSLCertPath,
            },
              {
                Type: "bind",
                Source: agentSSLKeyPath,
                Target: proxySSLKeyPath,
              });
          }
        }

        if (createOptions.ExposedPorts && createOptions.HostConfig && openPorts) {
          createOptions.HostConfig.PortBindings[`${proxyDetails.tcpPort}/tcp`] = [{ HostPort: `${proxyDetails.tcpPort}` }];
          createOptions.HostConfig.PortBindings[`${proxyDetails.udpPort}/udp`] = [{ HostPort: `${proxyDetails.udpPort}` }];

          createOptions.ExposedPorts[`${proxyDetails.tcpPort}/tcp`] = {}
          createOptions.ExposedPorts[`${proxyDetails.udpPort}/udp`] = {}
        }

        if (proxyDetails.saveSession && image.volumeMountPath) {
          createOptions.HostConfig?.Mounts?.push({
            Type: "volume",
            Source: proxyDetails.sessionId,
            Target: image.volumeMountPath,
          });
        }

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
            darkMode: proxyDetails.darkMode,
            sharedMemory: proxyDetails.sharedMemory,
            saveSession: proxyDetails.saveSession,
            imageId: proxyDetails.imageId,
            status: proxyDetails.status,
            tcpPort: proxyDetails.tcpPort || undefined,
            udpPort: proxyDetails.udpPort || undefined,
            adminPassword: proxyDetails.adminPassword,
            userPassword: proxyDetails.userPassword,
            environmentVariablesUsed: createOptions.Env
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
  participantExistsBySessionAndId: async (sessionId: string, participantId: string): Promise<boolean> => {
    try {
      const exists = await mongoUtils.existsDocument<IParticipant>(
        ParticipantModel,
        {
          sessionId,
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
  getSessionById: async (sessionId: string): Promise<ISession> => {
    try {
      const key = `ACTIVE_SESSION|ID:${sessionId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

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
      redisUtils.setKey(key, JSON.stringify(sessions[0]), CACHE_TTL.ONE_DAY);
      return sessions[0];
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

      await new Promise((resolve) => setTimeout(resolve, 3000));

      if (proxyDetails.deletePersistence) {
        const volume = await docker.getVolume(proxyDetails.sessionId);
        if (volume) await volume.remove();
      }

      redisUtils.delKey(`SESSION|ID:${proxyDetails.sessionId}`);
      redisUtils.delKey(`SESSIONS|CLIENT:${proxyDetails.clientId}`);
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
            tcpPortRange: 1,
            udpPortRange: 1,
            proxyUrlPath: 1
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
  getAgentById: async (agentId: string): Promise<IAgent> => {
    try {
      const key = `AGENT|ID:${agentId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const agents: IAgent[] =
        await mongoUtils.findDocumentsWithOptions<IAgent>(
          AgentModel,
          {
            agentId,
            isActive: AGENTS_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            clientId: 0,
            createdAt: 0,
            updatedAt: 0,
            isActive: 0,
          },
          {}
        );
      redisUtils.setKey(key, JSON.stringify(agents[0]), CACHE_TTL.ONE_DAY);
      return agents[0];
    } catch (error) {
      loggerUtils.error(
        `proxyService :: getAgentById :: agentId ${agentId} :: ${error}`
      );
      throw error;
    }
  },
};

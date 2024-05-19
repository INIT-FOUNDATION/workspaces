import express from "express";
import routes from "./startup/routes";
import helmet from "helmet";
import {
  mongoUtils,
  loggerUtils,
  envUtils,
  redisUtils,
} from "workspaces-micro-commons";
import { proxyService } from "./api/services/proxyService";

const app = express();
const PORT = envUtils.getNumberEnvVariableOrDefault("PORT", 5002);
const MODULE = envUtils.getStringEnvVariableOrDefault(
  "MODULE",
  "workspaces-micro-proxy"
);
const pullImages = envUtils.getBooleanEnvVariableOrDefault(
  "WORKSPACES_PULL_IMAGES",
  false
);

app.use(express.json());
app.use(helmet());

routes(app);

app.listen(PORT, async () => {
  loggerUtils.info(`app :: ${MODULE} is running on port ${PORT}`);

  await mongoUtils.connect();
  await redisUtils.primaryRedisClient.connect();
  await redisUtils.readRedisReplicaClient.connect();
  if (pullImages) await proxyService.pullAvailableImages();
});

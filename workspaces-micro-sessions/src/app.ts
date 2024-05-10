import express from "express";
import routes from "./startup/routes";
import helmet from "helmet";
import { mongoUtils, loggerUtils, envUtils, redisUtils } from "workspaces-micro-commons";

const app = express();
const PORT = envUtils.getNumberEnvVariableOrDefault("PORT", 5001)
const MODULE = envUtils.getStringEnvVariableOrDefault("MODULE", "workspaces-micro-sessions")

app.use(express.json());
app.use(helmet());

routes(app);

app.listen(PORT, () => {
  loggerUtils.info(`app :: ${MODULE} is running on port ${PORT}`);

mongoUtils.connect();
  redisUtils;
  redisUtils.primaryRedisClient.connect();
  redisUtils.readRedisReplicaClient.connect();
});
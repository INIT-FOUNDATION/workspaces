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
import fs from "fs";
import https from "https";
import http from "http";

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
const HTTPS_ENABLED = envUtils.getBooleanEnvVariableOrDefault("HTTPS_ENABLED", false);
const HTTPS_PORT = envUtils.getNumberEnvVariableOrDefault("HTTPS_PORT", 443);
const SSL_KEY_PATH = envUtils.getStringEnvVariableOrDefault("SSL_KEY_PATH", "/usr/src/app/certs/key.pem");
const SSL_CERT_PATH = envUtils.getStringEnvVariableOrDefault("SSL_CERT_PATH", "/usr/src/app/certs/cert.pem");

app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: envUtils.getStringEnvVariableOrDefault("WORKSPACE_PROXY_FRAME_ANCESTORS", "self,*").split(","),
    },
  },
  frameguard: false,
}));

routes(app);

const startServer = async () => {
  if (HTTPS_ENABLED) {
    const options = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
    };

    https.createServer(options, app).listen(HTTPS_PORT, async () => {
      loggerUtils.info(`app :: ${MODULE} is running on HTTPS port ${HTTPS_PORT}`);

      await mongoUtils.connect();
      await redisUtils.primaryRedisClient.connect();
      await redisUtils.readRedisReplicaClient.connect();
      if (pullImages) await proxyService.pullAvailableImages();
    });
  } else {
    http.createServer(app).listen(PORT, async () => {
      loggerUtils.info(`app :: ${MODULE} is running on HTTP port ${PORT}`);

      await mongoUtils.connect();
      await redisUtils.primaryRedisClient.connect();
      await redisUtils.readRedisReplicaClient.connect();
      if (pullImages) await proxyService.pullAvailableImages();
    });
  }
};

startServer();

import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import {
  HTTP_STATUS_CODES,
  envUtils,
  loggerUtils,
  mongoUtils,
  redisUtils,
} from "workspaces-micro-commons";
import { websocketController } from "./websocket/controllers/websocketController";

const app = express();
const port = process.env.PORT || 5003;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  pingInterval: envUtils.getNumberEnvVariableOrDefault(
    "WORKSPACES_WS_DEFAULT_PING_INTERVAL",
    5000
  ),
  pingTimeout: envUtils.getNumberEnvVariableOrDefault(
    "WORKSPACES_WS_DEFAULT_PING_TIMEOUT",
    5000
  ),
  cors: {
    origin: envUtils.getStringEnvVariableOrDefault(
      "WORKSPACES_WS_DEFAULT_ORIGINS",
      "*"
    ),
  },
});
const PORT = envUtils.getNumberEnvVariableOrDefault("PORT", 5003);
const MODULE = envUtils.getStringEnvVariableOrDefault(
  "MODULE",
  "workspaces-micro-websocket"
);

io.on("connection", websocketController.handleSocketConnection);

app.get("/api/v1/websocket/health", (req, res) => {
  res.status(HTTP_STATUS_CODES.OK).send({ data: null, message: "Websocket Service is up and running" });
});

server.listen(port, () => {
  loggerUtils.info(`app :: ${MODULE} is running on port ${PORT}`);

  mongoUtils.connect();
  redisUtils.primaryRedisClient.connect();
  redisUtils.readRedisReplicaClient.connect();
});

import express, { Request, Response, Express, NextFunction } from "express";
import bodyParser from "body-parser";
import { proxyRouter } from "../api/routes/proxyRouter";
import {
  CACHE_TTL,
  HTTP_STATUS_CODES,
  envUtils,
  expressConstants,
  loggerUtils,
  nodeCacheUtils,
} from "workspaces-micro-commons";
import { createProxyMiddleware } from "http-proxy-middleware";
import { proxyMiddleware } from "../api/middleware/proxyMiddleware";
import { IImage, ISession } from "../types/custom";
import { proxyService } from "../api/services/proxyService";

export default function (app: Express): void {
  app.use(express.json());

  app.use(function (req: Request, res: Response, next: NextFunction): void {
    if (req.body) {
      const riskyChars =
        (expressConstants.RISKY_CHARACTERS &&
          expressConstants.RISKY_CHARACTERS.split(",")) ||
        [];
      for (const key in req.body) {
        if (req.body && req.body[key] && typeof req.body[key] === "string") {
          if (riskyChars.indexOf(req.body[key].charAt(0)) >= 0) {
            req.body[key] = req.body[key].slice(1);
          }
          req.body[key] = req.body[key].replace(new RegExp(`[${riskyChars.join('')}]`, 'g'), "");
        }
      }
    }

    res.header("Access-Control-Allow-Origin", expressConstants.ALLOWED_ORIGINS);
    res.header(
      "Access-Control-Allow-Methods",
      expressConstants.ALLOWED_METHODS
    );
    res.header("Server", "");
    res.header(
      "Access-Control-Allow-Headers",
      expressConstants.ALLOWED_HEADERS
    );
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  const router = async (req: Request) => {
    try {
      const defaultProxyPort = envUtils.getNumberEnvVariableOrDefault("WORKSPACES_PROXY_PORT", 8080)
      const environment = envUtils.getStringEnvVariableOrDefault(
        "NODE_ENV",
        "Development"
      );

      if (req && req.params) {
        const { sessionId, participantId } = req.params;
        const sessionsDetails: ISession[] = await proxyService.getSessionById(sessionId);
        const sessionDetails = sessionsDetails[0];
        const proxyPort = sessionDetails.tcpPort || defaultProxyPort;
        nodeCacheUtils.setKey('WORKSPACES_CURRENT_SESSION', { sessionId, participantId }, CACHE_TTL.ONE_HOUR);
        return `http://${environment === "Development" ? "localhost" : sessionId}:${proxyPort}`
      } else {
        const sessionData = await nodeCacheUtils.getKey('WORKSPACES_CURRENT_SESSION')
        if (sessionData && sessionData.sessionId) {
          const sessionsDetails: ISession[] = await proxyService.getSessionById(sessionData.sessionId);
          const sessionDetails = sessionsDetails[0];
          const proxyPort = sessionDetails.tcpPort || defaultProxyPort;
          return `http://${environment === "Development" ? "localhost" : sessionData.sessionId}:${proxyPort}`
        }
      }
    } catch (error) {
      loggerUtils.error(`routes :: router :: ${error}`);
      throw error;
    }
  };

  const proxyOptions = {
    router,
    ws: true,
    changeOrigin: true,
    timeout: envUtils.getNumberEnvVariableOrDefault("WORKSPACES_PROXY_READ_TIMEOUT", 60 * 1000),
    proxyTimeout: envUtils.getNumberEnvVariableOrDefault("WORKSPACES_PROXY_WRITE_TIMEOUT", 60 * 1000),
    pathRewrite: async (path: string, req: Request) => {
      let sessionId, participantId;

      if (req.params && req.params.sessionId && req.params.participantId) {
        sessionId = req.params.sessionId;
        participantId = req.params.participantId;
        nodeCacheUtils.setKey('WORKSPACES_CURRENT_SESSION', { sessionId, participantId }, CACHE_TTL.ONE_HOUR);
      } else {
        const sessionData = await nodeCacheUtils.getKey('WORKSPACES_CURRENT_SESSION')
        sessionId = sessionData.sessionId;
        participantId = sessionData.participantId;
      }
      return path.replace(`/api/v1/proxy/${sessionId}/${participantId}`, '');
    },
    logger: loggerUtils,
  }

  app.use("/api/v1/proxy/:sessionId/:participantId", proxyMiddleware, createProxyMiddleware<Request, Response>(proxyOptions))
  app.use("/api/v1/proxy", proxyRouter);
}
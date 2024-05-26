import express, { Request, Response, Express, NextFunction } from "express";
import bodyParser from "body-parser";
import { proxyRouter } from "../api/routes/proxyRouter";
import {
  CACHE_TTL,
  HTTP_STATUS_CODES,
  envUtils,
  expressConstants,
  nodeCacheUtils,
} from "workspaces-micro-commons";
import { createProxyMiddleware } from "http-proxy-middleware";
import { proxyMiddleware } from "../api/middleware/proxyMiddleware";
import { IImage } from "../types/custom";
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

  app.use('/api/v1/session/:sessionId/:participantId', proxyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const defaultProxyPort = envUtils.getNumberEnvVariableOrDefault("WORKSPACES_PROXY_PORT", 8080);
      const defaultProxyPath = envUtils.getStringEnvVariableOrDefault("WORKSPACES_PROXY_PATH", "");
      const environment = envUtils.getStringEnvVariableOrDefault("NODE_ENV", "Development");
      let targetPath, sessionId, participantId;

      if (req && req.params) {
        sessionId = req.params.sessionId;
        participantId = req.params.participantId;

        const image: IImage = await proxyService.getImageDetailsBySessionId(sessionId);
        const primaryPortDetails = image.runningPorts.find(runningPort => runningPort.primary);

        const proxyPort = primaryPortDetails?.port || defaultProxyPort;
        const proxyPath = image.proxyUrlPath || defaultProxyPath;

        nodeCacheUtils.setKey('WORKSPACES_CURRENT_SESSION', { sessionId, participantId }, CACHE_TTL.ONE_HOUR);
        targetPath = `http://${environment === "Development" ? "localhost" : sessionId}:${proxyPort}${proxyPath}`;
      } else {
        const sessionData = await nodeCacheUtils.getKey('WORKSPACES_CURRENT_SESSION');
        if (sessionData && sessionData.sessionId && sessionData.participantId) {
          sessionId = sessionData.sessionId;
          participantId = sessionData.participantId;

          const image: IImage = await proxyService.getImageDetailsBySessionId(sessionData.sessionId);
          const primaryPortDetails = image.runningPorts.find(runningPort => runningPort.primary);

          const proxyPort = primaryPortDetails?.port || defaultProxyPort;
          const proxyPath = image.proxyUrlPath || defaultProxyPath;

          targetPath = `http://${environment === "Development" ? "localhost" : sessionData.sessionId}:${proxyPort}${proxyPath}`;
        }
      }

      if (targetPath) {
        createProxyMiddleware({
          target: targetPath,
          ws: true,
          changeOrigin: true,
          xfwd: true,
          pathRewrite: {
            [`^/api/v1/session/${sessionId}/${participantId}`]: '',
          },
        })(req, res, next);
      } else {
        res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send("routes :: Unable to determine target path.");
      }
    } catch (error) {
      next(error);
    }
  });
}
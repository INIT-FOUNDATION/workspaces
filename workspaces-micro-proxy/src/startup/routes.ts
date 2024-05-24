import express, { Request, Response, Express, NextFunction } from "express";
import bodyParser from "body-parser";
import { proxyRouter } from "../api/routes/proxyRouter";
import {
  envUtils,
  expressConstants,
  loggerUtils,
  nodeCacheUtils,
} from "workspaces-micro-commons";
import { createProxyMiddleware } from "http-proxy-middleware";
import { proxyMiddleware } from "../api/middleware/proxyMiddleware";

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
          req.body[key] = req.body[key].replace(/{|}|>|<|=/g, "");
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
      const environment = envUtils.getStringEnvVariableOrDefault(
        "NODE_ENV",
        "Development"
      );

      if (environment == "Development") {
        return "http://localhost:3000"
      }

      if (req && req.params) {
        const { sessionId } = req.params;
        nodeCacheUtils.setKey('WORKSPACES_CURRENT_SESSION', { sessionId }, 300);
        return `http://${sessionId}:3000`
      } else {
        const sessionData = await nodeCacheUtils.getKey('WORKSPACES_CURRENT_SESSION')
        if (sessionData.sessionId)
          return `http://${sessionData.sessionId}:3000`
      }
    } catch (error) {
      loggerUtils.error(`routes :: router :: ${error}`);
      throw error;
    }
  };

  const proxyOptions = {
    changeOrigin: true,
    ws: true,
    router,
  };

  app.use(
    "/api/v1/proxy/:sessionId/:participantId",
    proxyMiddleware,
    createProxyMiddleware<Request, Response>(proxyOptions)
  );

  app.use("/api/v1/proxy", proxyRouter);
}

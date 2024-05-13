import { Request, Response } from "express";
import { proxyService } from "../services/proxyService";
import {
  HTTP_STATUS_CODES,
  envUtils,
  loggerUtils,
} from "workspaces-micro-commons";
import { PROXY_ERROR_RESPONSES } from "../../constants";
import {
  validateCreateProxy,
  validateDeleteProxy,
  validateJoinProxy,
} from "../../validations";
import httpProxy from "http-proxy";
const environment = envUtils.getStringEnvVariableOrDefault("NODE_ENV", "Development");

export const proxyController = {
  createProxy: async (req: Request, res: Response): Promise<Response> => {
    try {
      const proxyDetails = req.body;

      const { error } = validateCreateProxy(proxyDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: PROXY_ERROR_RESPONSES.PROXYERR001,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: PROXY_ERROR_RESPONSES.PROXYERR001,
            errorMessage: error.message,
          });
      }

      const imageExists = await proxyService.imageExistsById(
        proxyDetails.imageId
      );

      if (!imageExists) {
        loggerUtils.error(
          "proxyController :: createProxy :: image does not exists"
        );
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(PROXY_ERROR_RESPONSES.PROXYERR008);
      }

      await proxyService.createProxy(proxyDetails);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: null,
        message: "Proxy Created Successfully",
      });
    } catch (error) {
      loggerUtils.error(`proxyController :: createProxy :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(PROXY_ERROR_RESPONSES.PROXYERR000);
    }
  },
  joinProxy: async (req: Request, res: Response) => {
    try {
      const proxyDetails: any = {
        sessionId: req.params.sessionId,
        participantId: req.params.participantId,
      };

      const { error } = validateJoinProxy(proxyDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: PROXY_ERROR_RESPONSES.PROXYERR001.errorCode,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: PROXY_ERROR_RESPONSES.PROXYERR001.errorCode,
            errorMessage: error.message,
          });
      }

      const sessionExists: boolean = await proxyService.sessionExistsById(
        proxyDetails.sessionId
      );

      if (!sessionExists) {
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(PROXY_ERROR_RESPONSES.PROXYERR007);
      }

      const participantExists: boolean =
        await proxyService.participantExistsById(proxyDetails.participantId);

      if (!participantExists) {
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(PROXY_ERROR_RESPONSES.PROXYERR009);
      }

      const proxy = httpProxy.createProxyServer();

      req.baseUrl = ""
      req.url = "/";

      // Only one session is permitted on development environment
      proxy.web(req, res, {
        target:
          environment == "Development"
            ? "http://localhost:3000"
            : `http://${proxyDetails.sessionId}:3000`,
        ws: true
      });
    } catch (error) {
      loggerUtils.error(`proxyController :: joinProxy :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(PROXY_ERROR_RESPONSES.PROXYERR000);
    }
  },
  destroyProxy: async (req: Request, res: Response) => {
    try {
      const proxyDetails = req.body;
      proxyDetails.sessionId = req.params.sessionId;

      const { error } = validateDeleteProxy(proxyDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: PROXY_ERROR_RESPONSES.PROXYERR001,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: PROXY_ERROR_RESPONSES.PROXYERR001,
            errorMessage: error.message,
          });
      }

      const sessionExists: boolean = await proxyService.sessionExistsById(
        proxyDetails.sessionId
      );

      if (!sessionExists)
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(PROXY_ERROR_RESPONSES.PROXYERR007);

      await proxyService.destroyProxy(proxyDetails);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: null,
        message: "Proxy Destroyed Successfully",
      });
    } catch (error) {
      loggerUtils.error(`proxyController :: destroyProxy :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(PROXY_ERROR_RESPONSES.PROXYERR000);
    }
  },
};

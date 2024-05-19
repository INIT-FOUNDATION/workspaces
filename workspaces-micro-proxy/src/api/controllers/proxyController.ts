import { Request, Response } from "express";
import { proxyService } from "../services/proxyService";
import { HTTP_STATUS_CODES, loggerUtils } from "workspaces-micro-commons";
import { PROXY_ERROR_RESPONSES } from "../../constants";
import { validateCreateProxy, validateDeleteProxy } from "../../validations";

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

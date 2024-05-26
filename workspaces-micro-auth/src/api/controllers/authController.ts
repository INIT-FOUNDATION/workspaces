
import { Request, Response } from "express";
import { authService } from "../services/authService";
import { CACHE_TTL, ERROR_MESSAGES, HTTP_STATUS_CODES, loggerUtils } from "workspaces-micro-commons";;
import { ERROR_RESPONSES } from "../../constants";
import { validateClientDetails, validateGenerateToken, validateUpdateClientDetails } from "../../validations";
import { Client } from "../../models/authModel";
import { ClientDetails, IClient } from "../../types/custom";

export const authController = {
  healthCheck: async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: null,
        message: "Auth Service is Up and Running!",
      });
    } catch (error) {
      loggerUtils.error(`authController :: healthCheck :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(ERROR_RESPONSES.AUTHERR000);
    }
  },
  createClient: async (req: Request, res: Response): Promise<Response> => {
    try {
      const clientDetails: ClientDetails = new Client(req.body);
      const { error } = validateClientDetails(clientDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: ERROR_RESPONSES.AUTHERR001,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: ERROR_RESPONSES.AUTHERR001,
            errorMessage: error.message,
          });
      }

      const clientAlreadyExists: boolean = await authService.clientExistsByName(clientDetails.clientName);

      if (clientAlreadyExists) {
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(ERROR_RESPONSES.AUTHERR004);
      }

      const clientCreated = await authService.createClient(clientDetails);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: clientCreated,
        message: "Client Created Successfully",
      });
    } catch (error) {
      loggerUtils.error(`authController :: create :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(ERROR_RESPONSES.AUTHERR000);
    }
  },
  generateToken: async (req: Request, res: Response): Promise<Response> => {
    try {
      const credentials: ClientDetails = req.body;

      const { error } = validateGenerateToken(credentials);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: ERROR_RESPONSES.AUTHERR001.errorCode,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: ERROR_RESPONSES.AUTHERR001.errorCode,
            errorMessage: error.message,
          });
      }

      const clientExists = await authService.clientExistsByCredentials(credentials.clientId, credentials.clientSecret);

      if (!clientExists) return res
        .status(HTTP_STATUS_CODES.BAD_REQUEST)
        .send(ERROR_RESPONSES.AUTHERR003);

      const tokenDetails: any = await authService.generateToken(credentials);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { token: tokenDetails.token, ttl: tokenDetails.ttl },
        message: `Token Generated Successfully, Will expire in ${tokenDetails.ttl} seconds`,
      });
    } catch (error) {
      loggerUtils.error(`authController :: token :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(ERROR_RESPONSES.AUTHERR000);
    }
  },
  updateClientById: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const clientDetails: ClientDetails = req.body;
      clientDetails.clientId = req.params.clientId;

      const { error } = validateUpdateClientDetails(clientDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: ERROR_RESPONSES.AUTHERR001.errorCode,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: ERROR_RESPONSES.AUTHERR001.errorCode,
            errorMessage: error.message,
          });
      }

      const clientExists: boolean = await authService.clientExistsById(clientDetails.clientId);

      if (!clientExists) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).send(ERROR_RESPONSES.AUTHERR006);
      }

      await authService.updateClientById(clientDetails);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { clientId: clientDetails.clientId },
        message: "Client Updated Successfully",
      });
    } catch (error) {
      loggerUtils.error(`authController :: updateClient :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  deleteClientById: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const clientId: string = req.params.clientId;

      if (!clientId) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send(ERROR_RESPONSES.AUTHERR005);
      }

      const clientExists: boolean = await authService.clientExistsById(clientId);

      if (!clientExists) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).send(ERROR_RESPONSES.AUTHERR006);
      }

      await authService.deleteClientById(clientId);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { clientId },
        message: "Client Deleted Successfully",
      });
    } catch (error) {
      loggerUtils.error(`authController :: deleteClient :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  getClientById: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const clientId: string = req.params.clientId;

      if (!clientId) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send(ERROR_RESPONSES.AUTHERR005);
      }

      const client: IClient[] = await authService.getClientById(clientId);

      if (client.length == 0) {
        return res.status(HTTP_STATUS_CODES.NOT_FOUND).send(ERROR_RESPONSES.AUTHERR006);
      }

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { clientDetails: client[0] },
        message: "Client Fetched Successfully",
      });
    } catch (error) {
      loggerUtils.error(`authController :: getClientById :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

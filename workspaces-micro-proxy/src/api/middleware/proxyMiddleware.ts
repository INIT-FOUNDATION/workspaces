import { Request as ExpressRequest, Response, NextFunction } from "express";
import {
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  loggerUtils,
} from "workspaces-micro-commons";
import { PROXY_ERROR_RESPONSES } from "../../constants";
import { proxyService } from "../services/proxyService";

interface Request extends ExpressRequest {
  decodedToken?: any;
}

export async function proxyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sessionId, participantId } = req.params;

    if (!sessionId) {
      return res
        .status(HTTP_STATUS_CODES.BAD_REQUEST)
        .send({ data: null, message: PROXY_ERROR_RESPONSES.PROXYERR010 });
    }

    if (!participantId) {
      return res
        .status(HTTP_STATUS_CODES.BAD_REQUEST)
        .send({ data: null, message: PROXY_ERROR_RESPONSES.PROXYERR011 });
    }

    const sessionExists: boolean = await proxyService.sessionExistsById(
      sessionId.toString()
    );

    if (!sessionExists) {
      return res
        .status(HTTP_STATUS_CODES.BAD_REQUEST)
        .send(PROXY_ERROR_RESPONSES.PROXYERR007);
    }

    const participantExists: boolean = await proxyService.participantExistsBySessionAndId(
      sessionId.toString(),
      participantId.toString()
    );

    if (!participantExists) {
      return res
        .status(HTTP_STATUS_CODES.BAD_REQUEST)
        .send(PROXY_ERROR_RESPONSES.PROXYERR009);
    }

    next();
  } catch (error) {
    loggerUtils.error(`proxyMiddleware :: proxyMiddleware :: ${error}`, error);
    return res
      .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
      .send({ data: null, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
}

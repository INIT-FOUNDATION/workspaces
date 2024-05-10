import {
  Request as ExpressRequest,
  Response,
  NextFunction,
  response,
} from "express";
import jwt from "jsonwebtoken";
import moment from "moment";
import {
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  jwtUtils,
  loggerUtils,
  redisUtils,
} from "workspaces-micro-commons";
import { sessionService } from "../services/sessionsService";

interface Request extends ExpressRequest {
  decodedToken?: any;
}

export async function clientMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(HTTP_STATUS_CODES.UNAUTHORIZED)
        .send({ data: null, message: ERROR_MESSAGES.UNAUTHORIZED });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      jwtUtils.getSecret(),
      async (error: jwt.VerifyErrors | null, decoded: any) => {
        if (error) {
          loggerUtils.error(
            `clientMiddleware :: clientMiddleware :: Jwt Verify :: ${error}`
          );
          return res
            .status(HTTP_STATUS_CODES.FORBIDDEN)
            .send({ data: null, message: ERROR_MESSAGES.FORBIDDEN });
        }

        const clientDetailsCache = await redisUtils.getKey(decoded.clientId);

        if (!clientDetailsCache)
          return res
            .status(HTTP_STATUS_CODES.UNAUTHORIZED)
            .send({ data: null, message: ERROR_MESSAGES.UNAUTHORIZED });

        if (moment().isAfter(moment(decoded.accessExpiryDate)))
          return res
            .status(HTTP_STATUS_CODES.FORBIDDEN)
            .send({
              data: null,
              message: "Access Expired, Please renew to continue!",
            });

        const sessionsCount: number =
          await sessionService.getSessionsCountByClientId(decoded.clientId);

        if (sessionsCount == decoded.sessionsLimit)
          return res
            .status(HTTP_STATUS_CODES.FORBIDDEN)
            .send({
              data: null,
              message: "Sessions Limit Exceeded, Please increase to continue!",
            });

        req.decodedToken = decoded;

        next();
      }
    );

    return response;
  } catch (error) {
    loggerUtils.error(
      `clientMiddleware :: clientMiddleware :: ${error}`,
      error
    );
    return res
      .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
      .send({ data: null, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
}

import {
  Request as ExpressRequest,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";
import {
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  jwtUtils,
  loggerUtils,
} from "workspaces-micro-commons";

interface Request extends ExpressRequest {
  decodedToken?: any;
}

export async function sessionsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(HTTP_STATUS_CODES.UNAUTHORIZED)
        .send({ data: null, message: ERROR_MESSAGES.UNAUTHORIZED });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(token, jwtUtils.getSecret(), (error: jwt.VerifyErrors | null, decoded: any) => {
        if (error) {
          loggerUtils.error(
            `sessionsMiddleware :: sessionsMiddleware :: Jwt Verify :: ${error}`
          );
          reject(error);
        } else {
          resolve(decoded);
        }
      });
    });

    req.decodedToken = decoded;

    return res.status(HTTP_STATUS_CODES.OK).send({
      data: decoded,
      message: "Session Proxy Details Fetched Successfully",
    });
  } catch (error) {
    loggerUtils.error(
      `sessionsMiddleware :: sessionsMiddleware :: ${error}`,
      error
    );
    return res
      .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
      .send({ data: null, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
}

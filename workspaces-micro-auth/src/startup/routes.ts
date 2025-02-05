import express, { Request, Response, Express, NextFunction } from "express";
import bodyParser from "body-parser";
import { authRouter } from "../api/routes/authRouter";
import { expressConstants } from "workspaces-micro-commons";

export default function (app: Express): void {
  app.use(express.json());

  app.use(function (req: Request, res: Response, next: NextFunction): void {
    if (req.body) {
      const riskyChars =
        (expressConstants.RISKY_CHARACTERS && expressConstants.RISKY_CHARACTERS.split(",")) || [];
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
    res.header("Access-Control-Allow-Methods", expressConstants.ALLOWED_METHODS);
    res.header("Server", "");
    res.header("Access-Control-Allow-Headers", expressConstants.ALLOWED_HEADERS);
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use("/api/v1/auth", authRouter);
}
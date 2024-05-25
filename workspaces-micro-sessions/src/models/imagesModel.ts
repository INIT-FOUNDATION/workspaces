import { Model, Schema } from "mongoose";
import { IImage, RunningPorts } from "../types/custom";
import { MONGO_COLLECTIONS, mongoUtils } from "workspaces-micro-commons";
import { randomUUID } from "crypto";
import { IMAGES_STATUS } from "../constants/imagesStatus";

class Image {
  imageId: string;
  imageName: string;
  imageRepo: string;
  imageTag: string;
  registryHost: string;
  registryUsername: string;
  registryPassword: string;
  isActive: boolean;
  clientId: string;
  runningPorts: RunningPorts[];
  volumeMountPath: string;
  defaultEnvs: string[];

  constructor(image: IImage) {
    this.imageId = image.imageId || randomUUID();
    this.imageName = image.imageName;
    this.imageRepo = image.imageRepo;
    this.imageTag = image.imageTag || "latest";
    this.registryHost = image.registryHost;
    this.registryUsername = image.registryUsername;
    this.registryPassword = image.registryPassword;
    this.isActive = IMAGES_STATUS.ACTIVE;
    this.clientId = image.clientId;
    this.runningPorts = image.runningPorts;
    this.volumeMountPath = image.volumeMountPath;
    this.defaultEnvs = image.defaultEnvs;
  }
}

const ImageModel: Model<IImage> = mongoUtils.createModel(
  MONGO_COLLECTIONS.IMAGES,
  new Schema<IImage>(
    {
      imageId: { type: String, required: true },
      imageName: { type: String, required: true },
      imageRepo: { type: String, required: true },
      imageTag: { type: String, required: true },
      registryHost: { type: String },
      registryUsername: { type: String },
      registryPassword: { type: String },
      isActive: { type: Boolean, required: true },
      clientId: { type: String, required: true },
      runningPorts: {
        type: [{
          port: Number,
          protocol: String
        }],
        required: true
      },
      volumeMountPath: { type: String },
      defaultEnvs: { type: [String] },
    },
    {
      timestamps: true,
    }
  )
);

export { Image, ImageModel };

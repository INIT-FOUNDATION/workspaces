import { Model, Schema } from "mongoose";
import { IImage } from "../types/custom";
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
  tcpPortRange: string;
  udpPortRange: string;
  volumeMountPath: string;
  defaultEnvs: string[];
  proxyUrlPath: string;

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
    this.tcpPortRange = image.tcpPortRange;
    this.udpPortRange = image.udpPortRange;
    this.volumeMountPath = image.volumeMountPath;
    this.defaultEnvs = image.defaultEnvs;
    this.proxyUrlPath = image.proxyUrlPath;
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
      tcpPortRange: { type: String, required: true },
      udpPortRange: { type: String, required: true },
      volumeMountPath: { type: String },
      defaultEnvs: { type: [String] },
      proxyUrlPath: { type: String }
    },
    {
      timestamps: true,
    }
  )
);

export { Image, ImageModel };

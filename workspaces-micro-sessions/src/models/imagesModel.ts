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

  constructor(image: IImage) {
    this.imageId = image.imageId || randomUUID();
    this.imageName = image.imageName;
    this.imageRepo = image.imageRepo;
    this.imageTag = image.imageTag || "latest";
    this.registryHost = image.registryHost;
    this.registryUsername = image.registryUsername;
    this.registryPassword = image.registryPassword;
    this.isActive = IMAGES_STATUS.ACTIVE;
  }
}

const ImageModel: Model<IImage> =
  mongoUtils.createModel(
    MONGO_COLLECTIONS.IMAGES,
    new Schema<IImage>({
      imageId: { type: String, required: true },
      imageName: { type: String, required: true },
      imageRepo: { type: String, required: true },
      imageTag: { type: String, required: true },
      registryHost: { type: String },
      registryUsername: { type: String },
      registryPassword: { type: String },
      isActive: { type: Boolean, required: true },
    }, {
      timestamps: true,
    })
  );

export { Image, ImageModel };

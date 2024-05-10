import { Model, Schema } from "mongoose";
import { IImage } from "../types/custom";
import { MONGO_COLLECTIONS, mongoUtils } from "workspaces-micro-commons";

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

export { ImageModel };

import { Model, Schema } from 'mongoose';
import { IImage } from '../types/custom';
import { MONGO_COLLECTIONS, mongoUtils } from 'workspaces-micro-commons';

const imageSchema = new Schema<IImage>({
  imageId: { type: String, required: true },
  imageName: { type: String, required: true },
  imageRepo: { type: String, required: true },
  imageTag: { type: String, required: true },
  registryHost: { type: String },
  registryUsername: { type: String },
  registryPassword: { type: String },
  runningPorts: {
    type: [{
      port: Number,
      protocol: String,
      primary: Boolean,
    }],
    required: true
  },
  volumeMountPath: { type: String },
  defaultEnvs: { type: [String] },
  proxyUrlPath: { type: String},
  isActive: { type: Boolean, required: true },
}, {
  timestamps: true,
});

const ImageModel: Model<IImage> = mongoUtils.createModel(
  MONGO_COLLECTIONS.IMAGES,
  imageSchema
);

export { ImageModel };

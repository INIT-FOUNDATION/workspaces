import mongoose, {
    Mongoose,
    ConnectOptions,
    Document,
    Model,
    Schema,
  } from "mongoose";
  import { envUtils } from "../config";
  import { loggerUtils } from "../monitoring/loggerUtils";
  
  let mongooseInstance: Mongoose | null = null;
  
  export async function connect(): Promise<Mongoose> {
    try {
      const host = envUtils.getStringEnvVariableOrDefault(
        "WORKSPACES_MONGODB_HOST",
        "localhost"
      );
  
      const port = envUtils.getNumberEnvVariableOrDefault(
        "WORKSPACES_MONGODB_PORT",
        27017
      );
  
      const connectionURI = `mongodb://${host}/${port}`;
  
      const options: ConnectOptions = {
        autoIndex: true,
        autoCreate: true,
        dbName: envUtils.getStringEnvVariableOrDefault(
          "WORKSPACES_MONGODB_DATABASE",
          "workspaces"
        ),
        authSource: envUtils.getStringEnvVariableOrDefault(
          "WORKSPACES_MONGODB_AUTH_SOURCE",
          "admin"
        ),
      };
  
      const username = envUtils.getStringEnvVariable("WORKSPACES_MONGODB_USERNAME");
      const password = envUtils.getStringEnvVariable("WORKSPACES_MONGODB_PASSWORD");
  
      if (username && password) {
        options.auth = { username, password };
      }
  
      const tlsCAFile = envUtils.getStringEnvVariable(
        "WORKSPACES_MONGODB_TLS_CA_FILE"
      );
      const tlsCertificateKeyFile = envUtils.getStringEnvVariable(
        "WORKSPACES_MONGODB_TLS_CERTIFICATE_KEY_FILE"
      );
  
      if (tlsCAFile && tlsCertificateKeyFile) {
        options.tls = true;
        options.tlsCAFile = tlsCAFile;
        options.tlsCertificateKeyFile = tlsCertificateKeyFile;
      }
  
      mongooseInstance = await mongoose.connect(connectionURI, options);
      loggerUtils.info("mongoUtils :: connect :: Connected to MongoDB");
  
      return mongooseInstance;
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: connect :: Error connecting to MongoDB :: ${error}`
      );
      throw error;
    }
  }
  
  export async function disconnect(): Promise<void> {
    try {
      if (mongooseInstance) {
        await mongooseInstance.disconnect();
        loggerUtils.info("mongoUtils :: disconnect :: Disconnected from MongoDB");
      }
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: disconnect :: Error disconnecting from MongoDB :: ${error}`
      );
      throw error;
    }
  }
  
  export function getConnection(): Mongoose | null {
    try {
      return mongooseInstance;
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: getConnection :: Error getting connection from MongoDB :: ${error}`
      );
      throw error;
    }
  }
  
  export function createModel<T extends Document>(
    collectionName: string,
    schemaDefinition: Record<string, any>
  ): Model<T> {
    try {
      const schema = new Schema(schemaDefinition);
      return mongoose.model<T>(collectionName, schema);
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: createModel :: Error creating model :: ${error}`
      );
      throw error;
    }
  }
  
  export async function insertDocument<T extends Document>(
    model: Model<T>,
    document: Partial<T>
  ): Promise<T> {
    try {
      const newDocument = new model(document);
      return await newDocument.save();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: insertDocument :: Error inserting document :: ${error}`
      );
      throw error;
    }
  }
  
  export async function findDocuments<T extends Document>(
    model: Model<T>,
    query: Record<string, any>
  ): Promise<T[]> {
    try {
      return await model.find(query).exec();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: findDocuments :: Error finding documents :: ${error}`
      );
      throw error;
    }
  }
  
  export async function updateDocuments<T extends Document>(
    model: Model<T>,
    query: Record<string, any>,
    update: Record<string, any>
  ): Promise<void> {
    try {
      await model.updateMany(query, update).exec();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: updateDocuments :: Error updating documents :: ${error}`
      );
      throw error;
    }
  }
  
  export async function deleteDocuments<T extends Document>(
    model: Model<T>,
    query: Record<string, any>
  ): Promise<void> {
    try {
      await model.deleteMany(query).exec();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: deleteDocuments :: Error deleting documents :: ${error}`
      );
      throw error;
    }
  }
  
  export async function distinctDocuments<T extends Document>(
    model: Model<T>,
    field: string,
    query: Record<string, any>
  ): Promise<any[]> {
    try {
      return await model.distinct(field, query).exec();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: distinctDocuments :: Error finding distinct documents :: ${error}`
      );
      throw error;
    }
  }
  
  export async function aggregateDocuments<T extends Document>(
    model: Model<T>,
    pipeline: any[]
  ): Promise<any[]> {
    try {
      return await model.aggregate(pipeline).exec();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: aggregateDocuments :: Error aggregating documents :: ${error}`
      );
      throw error;
    }
  }
  
  export async function findDocumentsWithOptions<T extends Document>(
    model: Model<T>,
    query: Record<string, any>,
    projection: Record<string, any>,
    options: Record<string, any>
  ): Promise<T[]> {
    try {
      return await model.find(query, projection, options).exec();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: findDocumentsWithOptions :: Error finding documents with options :: ${error}`
      );
      throw error;
    }
  }
  
  export async function existsDocument<T extends Document>(
    model: Model<T>,
    query: Record<string, any>
  ): Promise<boolean> {
    try {
      const count = await model.countDocuments(query).exec();
      return count > 0;
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: existsDocument :: Error checking existence of document :: ${error}`
      );
      throw error;
    }
  }
  
  export async function countDocuments<T extends Document>(
    model: Model<T>,
    query: Record<string, any>
  ): Promise<number> {
    try {
      return await model.countDocuments(query).exec();
    } catch (error) {
      loggerUtils.error(
        `mongoUtils :: countDocuments :: Error counting documents :: ${error}`
      );
      throw error;
    }
  }
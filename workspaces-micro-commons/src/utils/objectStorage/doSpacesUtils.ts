import { S3 } from "aws-sdk";
import { loggerUtils } from "../monitoring/loggerUtils";
import { getStringEnvVariable } from "../config/envUtils";

const spacesClient = new S3({
  endpoint: getStringEnvVariable("WORKSPACES_DO_SPACES_ENDPOINT"),
  accessKeyId: getStringEnvVariable("WORKSPACES_DO_SPACES_ACCESS_KEY"),
  secretAccessKey: getStringEnvVariable("WORKSPACES_DO_SPACES_SECRET_KEY"),
});

export async function listBucket(): Promise<any> {
  try {
    const buckets = await spacesClient.listBuckets().promise();
    loggerUtils.info(
      "doSpacesUtils :: listBucket :: Retrieved buckets successfully"
    );
    return buckets;
  } catch (error) {
    loggerUtils.error(
      `doSpacesUtils :: listBucket :: Error retrieving buckets :: ${error}`
    );
    throw error;
  }
}

export async function makeBucket(bucketName: string): Promise<any> {
  try {
    await spacesClient.createBucket({ Bucket: bucketName }).promise();
    loggerUtils.info(
      `doSpacesUtils :: makeBucket :: Created bucket "${bucketName}" successfully`
    );
  } catch (error) {
    loggerUtils.error(
      `doSpacesUtils :: makeBucket :: Error creating bucket "${bucketName}" :: ${error}`
    );
    throw error;
  }
}

export async function getObject(
  bucketName: string,
  objectName: string
): Promise<any> {
  try {
    const params = { Bucket: bucketName, Key: objectName };
    return await spacesClient.getObject(params).promise();
  } catch (error) {
    loggerUtils.error(
      `spacesUtils :: getObject :: Error getting object "${objectName}" from bucket "${bucketName}" :: ${error}`
    );
    throw error;
  }
}

export async function putObject(
  bucketName: string,
  objectName: string,
  data: any
): Promise<any> {
  try {
    const params = { Bucket: bucketName, Key: objectName, Body: data };
    await spacesClient.putObject(params).promise();
    loggerUtils.info(
      `spacesUtils :: putObject :: Successfully put object "${objectName}" to bucket "${bucketName}"`
    );
  } catch (error) {
    loggerUtils.error(
      `spacesUtils :: putObject :: Error putting object "${objectName}" to bucket "${bucketName}" :: ${error}`
    );
    throw error;
  }
}

export async function presignedGetObject(
  bucketName: string,
  objectName: string,
  expiry: number = 3600
): Promise<string> {
  try {
    const params = { Bucket: bucketName, Key: objectName, Expires: expiry };
    return spacesClient.getSignedUrlPromise("getObject", params);
  } catch (error) {
    loggerUtils.error(
      `spacesUtils :: presignedGetObject :: Error generating presigned URL for object "${objectName}" from bucket "${bucketName}" :: ${error}`
    );
    throw error;
  }
}
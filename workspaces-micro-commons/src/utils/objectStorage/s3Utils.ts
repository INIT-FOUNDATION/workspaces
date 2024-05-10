import { S3 } from "aws-sdk";
import { loggerUtils } from "../monitoring/loggerUtils";
import { getStringEnvVariableOrDefault } from "../config/envUtils";

const s3Client = new S3({
  endpoint: getStringEnvVariableOrDefault("WORKSPACES_S3_ENDPOINT", ""),
  accessKeyId: getStringEnvVariableOrDefault("WORKSPACES_S3_ACCESS_KEY", ""),
  secretAccessKey: getStringEnvVariableOrDefault("WORKSPACES_S3_SECRET_KEY", ""),
  region: getStringEnvVariableOrDefault("WORKSPACES_S3_REGION", "ap-south-1"),
});

export async function listBucket(): Promise<any> {
  try {
    const buckets = await s3Client.listBuckets().promise();
    loggerUtils.info("s3Utils :: listBucket :: Retrieved buckets successfully");
    return buckets;
  } catch (error) {
    loggerUtils.error(
      `s3Utils :: listBucket :: Error retrieving buckets :: ${error}`
    );
    throw error;
  }
}

export async function makeBucket(bucketName: string): Promise<any> {
  try {
    await s3Client.createBucket({ Bucket: bucketName }).promise();
    loggerUtils.info(
      `s3Utils :: makeBucket :: Created bucket "${bucketName}" successfully`
    );
  } catch (error) {
    loggerUtils.error(
      `s3Utils :: makeBucket :: Error creating bucket "${bucketName}" :: ${error}`
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
    return await s3Client.getObject(params).promise();
  } catch (error) {
    loggerUtils.error(
      `s3Utils :: getObject :: Error getting object "${objectName}" from bucket "${bucketName}" :: ${error}`
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
    await s3Client.putObject(params).promise();
    loggerUtils.info(
      `s3Utils :: putObject :: Successfully put object "${objectName}" to bucket "${bucketName}"`
    );
  } catch (error) {
    loggerUtils.error(
      `s3Utils :: putObject :: Error putting object "${objectName}" to bucket "${bucketName}" :: ${error}`
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
    return s3Client.getSignedUrlPromise("getObject", params);
  } catch (error) {
    loggerUtils.error(
      `s3Utils :: presignedGetObject :: Error generating presigned URL for object "${objectName}" from bucket "${bucketName}" :: ${error}`
    );
    throw error;
  }
}
import {
    S3Client,
    // This command supersedes the ListObjectsCommand and is the recommended way to list objects.
    ListObjectsV2Command,
  } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const BUCKET = process.env.AWS_BUCKET_NAME

const client = new S3Client({});

export const listObjects = async () => {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: folder_name+"/",
        Body: "folder creation",
      });

    try {
        let isTruncated = true;

        console.log("Your bucket contains the following objects:\n");
        let contents = "";

        while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } =
            await client.send(command);
        const contentsList = Contents.map((c) => ` • ${c.Key}`).join("\n");
        contents += contentsList + "\n";
        isTruncated = IsTruncated;
        command.input.ContinuationToken = NextContinuationToken;
        }
        console.log(contents);
    } catch (err) {
        console.error(err);
    }
};
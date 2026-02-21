import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT, // Required for Cloudflare R2
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
});

const BUCKET_NAME = process.env.S3_BUCKET || "bpeople-uploads";

/**
 * Generate a pre-signed URL for direct client-to-S3 uploads.
 * This prevents large files from passing through the Next.js server, saving bandwidth.
 * @param fileName
 * @param contentType
 */
export async function getUploadPresignedUrl(fileName: string, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        ContentType: contentType,
    });

    // URL expires in 5 minutes
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
        uploadUrl: url,
        fileUrl: `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`, // Or R2 custom domain
        fileName,
    };
}

/**
 * Generate a temporary URL to view a private file
 */
export async function getDownloadPresignedUrl(fileName: string) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
    });

    return getSignedUrl(s3, command, { expiresIn: 3600 }); // Expires in 1 hour
}

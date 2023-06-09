import AWS from "aws-sdk";
import { AWSProfileConfig, imageBucketName } from "statics/keys";

const S3 = new AWS.S3(AWSProfileConfig);
export async function profileImageAWS({ file, fileName, ContentType }: { file: AWS.S3.Body; fileName: string; ContentType: string }) {
	try {
		const params: AWS.S3.PutObjectRequest = {
			Bucket: imageBucketName + "/profile",
			Key: fileName,
			Body: file,
			ContentType: "image/webp",
			ContentDisposition: `inline; filename="${fileName}"`,
		};
		const res = await S3.upload(params).promise();
		return res;
	} catch (error) {
		return false;
	}
}

export async function portFolioImageAWS({ file, fileName }: { file: AWS.S3.Body; fileName: string }) {
	try {
		const params: AWS.S3.PutObjectRequest = {
			Bucket: imageBucketName + "/portfolio",
			Key: fileName,
			Body: file,
			ContentType: "image/webp",
			ContentDisposition: `inline; filename="${fileName}"`,
		};
		const res = await S3.upload(params).promise();
		return res;
	} catch (error) {
		return false;
	}
}

export async function teamLogoAWS({ file, fileName, ContentType }: { file: AWS.S3.Body; fileName: string; ContentType: string }) {
	try {
		const params: AWS.S3.PutObjectRequest = {
			Bucket: imageBucketName + "/team",
			Key: fileName,
			Body: file,
			ContentType: "image/webp",
			ContentDisposition: `inline; filename="${fileName}"`,
		};
		const res = await S3.upload(params).promise();
		return res;
	} catch (error) {
		return false;
	}
}

export async function courseImageAWS({ file, fileName, ContentType }: { file: AWS.S3.Body; fileName: string; ContentType: string }) {
	try {
		const params: AWS.S3.PutObjectRequest = {
			Bucket: imageBucketName + "/course",
			Key: fileName,
			Body: file,
			ContentType: "image/webp",
			ContentDisposition: `inline; filename="${fileName}"`,
		};
		const res = await S3.upload(params).promise();
		return res;
	} catch (error) {
		return false;
	}
}

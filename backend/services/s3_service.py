import os
import uuid
import logging
import boto3
from fastapi import UploadFile
from backend.config import settings

logger = logging.getLogger("farmai.s3")

class StorageService:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.region = settings.effective_s3_region
        self.s3_client = None
        self._init_client()

        # Ensure local uploads directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    def _init_client(self):
        if not self.bucket_name:
            return

        client_kwargs = {"region_name": self.region}
        # If static credentials are provided, use them; otherwise boto3 automatically
        # uses EC2 IAM Instance Profile / IMDSv2
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        try:
            self.s3_client = boto3.client("s3", **client_kwargs)
            logger.info(f"Initialized S3 client for bucket '{self.bucket_name}' in region '{self.region}'")
        except Exception as e:
            logger.warning(f"Failed to initialize S3 client: {e}. Defaulting to local storage.")
            self.s3_client = None

    async def upload_file(self, file: UploadFile) -> str:
        """
        Uploads file to S3 (with presigned URL / public URL) or stores locally, returning accessible URL.
        """
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        s3_key = f"complaints/{unique_name}"

        if self.s3_client and self.bucket_name:
            try:
                file_content = await file.read()
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=file_content,
                    ContentType=file.content_type or "image/jpeg"
                )
                
                # In modern AWS, buckets block public access by default.
                # Generate a long-lived presigned URL (7 days = 604800s) so images display securely
                try:
                    presigned_url = self.s3_client.generate_presigned_url(
                        ClientMethod="get_object",
                        Params={"Bucket": self.bucket_name, "Key": s3_key},
                        ExpiresIn=604800  # 7 days
                    )
                    return presigned_url
                except Exception:
                    # Fallback to direct S3 regional URL
                    return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"

            except Exception as e:
                logger.error(f"S3 upload error: {e}. Saving locally instead.")
        
        # Local upload fallback
        file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        file.file.seek(0)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return f"/uploads/{unique_name}"

storage_service = StorageService()

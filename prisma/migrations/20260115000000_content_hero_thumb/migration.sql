-- Add persisted thumbnail URL for content-page hero images.
ALTER TABLE "content_pages" ADD COLUMN "heroThumbUrl" TEXT;

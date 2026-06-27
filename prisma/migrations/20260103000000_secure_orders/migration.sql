-- Add an unguessable token for customer-facing order access.
ALTER TABLE "orders" ADD COLUMN "accessToken" TEXT;

UPDATE "orders"
SET "accessToken" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "accessToken" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "accessToken" SET NOT NULL;

CREATE UNIQUE INDEX "orders_accessToken_key" ON "orders"("accessToken");

ALTER TABLE "orders" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "orders" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "refundedAt" TIMESTAMP(3);

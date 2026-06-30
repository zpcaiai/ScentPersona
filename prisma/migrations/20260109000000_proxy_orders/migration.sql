-- Unified order model: proxy-order (代下单) support merged into "orders".

-- AlterTable: add discriminator + proxy snapshot / quote columns
ALTER TABLE "orders" ADD COLUMN     "orderType" TEXT NOT NULL DEFAULT 'sample_kit';
ALTER TABLE "orders" ADD COLUMN     "sourcePlatform" TEXT;
ALTER TABLE "orders" ADD COLUMN     "sourceOfferId" TEXT;
ALTER TABLE "orders" ADD COLUMN     "sourceProductUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN     "productTitle" TEXT;
ALTER TABLE "orders" ADD COLUMN     "productImageUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN     "productBrand" TEXT;
ALTER TABLE "orders" ADD COLUMN     "productSpec" TEXT;
ALTER TABLE "orders" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "orders" ADD COLUMN     "productPriceCents" INTEGER;
ALTER TABLE "orders" ADD COLUMN     "serviceFeeCents" INTEGER;
ALTER TABLE "orders" ADD COLUMN     "domesticShippingFeeCents" INTEGER;
ALTER TABLE "orders" ADD COLUMN     "estimatedTotalCents" INTEGER;
ALTER TABLE "orders" ADD COLUMN     "finalTotalCents" INTEGER;
ALTER TABLE "orders" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CNY';
ALTER TABLE "orders" ADD COLUMN     "quoteExpiresAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN     "priceSnapshotJson" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "orders" ADD COLUMN     "riskFlagsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "orders" ADD COLUMN     "userNote" TEXT;
ALTER TABLE "orders" ADD COLUMN     "adminNote" TEXT;

-- CreateIndex
CREATE INDEX "orders_orderType_status_idx" ON "orders"("orderType", "status");

-- CreateTable
CREATE TABLE "order_addresses" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "encryptedRawAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "purpose" TEXT NOT NULL DEFAULT 'order',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "paidAt" TIMESTAMP(3),
    "refundedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "rawDataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_purchases" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformOrderNo" TEXT,
    "purchaseAccountLabel" TEXT,
    "purchaseStatus" TEXT NOT NULL DEFAULT 'pending',
    "purchasedAt" TIMESTAMP(3),
    "purchaseCostCents" INTEGER,
    "screenshotUrl" TEXT,
    "rawDataJson" TEXT NOT NULL DEFAULT '{}',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carrierCode" TEXT,
    "carrierName" TEXT,
    "trackingNo" TEXT,
    "shippingStatus" TEXT NOT NULL DEFAULT 'pending',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "latestTrackingText" TEXT,
    "trackingRawJson" TEXT NOT NULL DEFAULT '{}',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "reason" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "providerRefundId" TEXT,
    "processedAt" TIMESTAMP(3),
    "rawDataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_price_adjustments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "oldTotalCents" INTEGER NOT NULL,
    "newTotalCents" INTEGER NOT NULL,
    "diffCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_price_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "operatorId" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_addresses_orderId_key" ON "order_addresses"("orderId");
CREATE INDEX "order_payments_orderId_idx" ON "order_payments"("orderId");
CREATE INDEX "order_payments_provider_providerPaymentId_idx" ON "order_payments"("provider", "providerPaymentId");
CREATE UNIQUE INDEX "order_purchases_orderId_key" ON "order_purchases"("orderId");
CREATE UNIQUE INDEX "order_shipments_orderId_key" ON "order_shipments"("orderId");
CREATE INDEX "order_refunds_orderId_idx" ON "order_refunds"("orderId");
CREATE INDEX "order_price_adjustments_orderId_status_idx" ON "order_price_adjustments"("orderId", "status");
CREATE INDEX "order_events_orderId_createdAt_idx" ON "order_events"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_purchases" ADD CONSTRAINT "order_purchases_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "order_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_price_adjustments" ADD CONSTRAINT "order_price_adjustments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "catalog_products" (
  "id" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "brand" TEXT,
  "mainImageUrl" TEXT,
  "category" TEXT DEFAULT 'fragrance',
  "concentration" TEXT,
  "volumeMl" INTEGER,
  "gender" TEXT,
  "scentFamily" TEXT,
  "topNotesJson" TEXT NOT NULL DEFAULT '[]',
  "middleNotesJson" TEXT NOT NULL DEFAULT '[]',
  "baseNotesJson" TEXT NOT NULL DEFAULT '[]',
  "scentTagsJson" TEXT NOT NULL DEFAULT '{}',
  "suitableScenesJson" TEXT NOT NULL DEFAULT '[]',
  "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_offers" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "platformProductId" TEXT,
  "title" TEXT NOT NULL,
  "brand" TEXT,
  "shopName" TEXT,
  "shopType" TEXT,
  "priceCents" INTEGER,
  "originalPriceCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'CNY',
  "rating" DOUBLE PRECISION,
  "reviewCount" INTEGER,
  "salesCount" INTEGER,
  "imageUrl" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "affiliateUrl" TEXT,
  "couponInfoJson" TEXT NOT NULL DEFAULT '{}',
  "rawDataJson" TEXT NOT NULL DEFAULT '{}',
  "riskFlagsJson" TEXT NOT NULL DEFAULT '[]',
  "qualityScore" INTEGER NOT NULL DEFAULT 0,
  "reviewStatus" TEXT NOT NULL DEFAULT 'needs_review',
  "fetchedAt" TIMESTAMP(3) NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_sources" (
  "id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "query" TEXT,
  "status" TEXT NOT NULL DEFAULT 'idle',
  "lastRunAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "price_history" (
  "id" TEXT NOT NULL,
  "productOfferId" TEXT NOT NULL,
  "priceCents" INTEGER,
  "originalPriceCents" INTEGER,
  "couponInfoJson" TEXT NOT NULL DEFAULT '{}',
  "fetchedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_match_candidates" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productOfferId" TEXT NOT NULL,
  "matchScore" INTEGER NOT NULL,
  "matchReason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_match_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_sync_jobs" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "platform" TEXT,
  "query" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "resultJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_product_events" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT,
  "productId" TEXT,
  "productOfferId" TEXT,
  "eventType" TEXT NOT NULL,
  "eventValueJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_product_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catalog_products_normalizedName_idx" ON "catalog_products"("normalizedName");
CREATE INDEX "catalog_products_brand_idx" ON "catalog_products"("brand");
CREATE UNIQUE INDEX "product_offers_platform_platformProductId_key" ON "product_offers"("platform", "platformProductId");
CREATE INDEX "product_offers_platform_fetchedAt_idx" ON "product_offers"("platform", "fetchedAt");
CREATE INDEX "product_offers_productId_idx" ON "product_offers"("productId");
CREATE INDEX "product_sources_platform_sourceType_idx" ON "product_sources"("platform", "sourceType");
CREATE INDEX "price_history_productOfferId_fetchedAt_idx" ON "price_history"("productOfferId", "fetchedAt");
CREATE INDEX "product_match_candidates_productId_status_idx" ON "product_match_candidates"("productId", "status");
CREATE INDEX "product_sync_jobs_type_status_createdAt_idx" ON "product_sync_jobs"("type", "status", "createdAt");
CREATE INDEX "user_product_events_eventType_createdAt_idx" ON "user_product_events"("eventType", "createdAt");
CREATE INDEX "user_product_events_sessionId_idx" ON "user_product_events"("sessionId");
CREATE INDEX "user_product_events_productId_idx" ON "user_product_events"("productId");

ALTER TABLE "product_offers" ADD CONSTRAINT "product_offers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_productOfferId_fkey" FOREIGN KEY ("productOfferId") REFERENCES "product_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_match_candidates" ADD CONSTRAINT "product_match_candidates_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_match_candidates" ADD CONSTRAINT "product_match_candidates_productOfferId_fkey" FOREIGN KEY ("productOfferId") REFERENCES "product_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_product_events" ADD CONSTRAINT "user_product_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_product_events" ADD CONSTRAINT "user_product_events_productOfferId_fkey" FOREIGN KEY ("productOfferId") REFERENCES "product_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

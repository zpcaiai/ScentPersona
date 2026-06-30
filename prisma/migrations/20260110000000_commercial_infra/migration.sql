-- Commercial Batch 1: accounts (Skill 38), profit (Skill 39), privacy/audit (Skill 41)

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "userId" TEXT;
ALTER TABLE "data_deletion_requests" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" TEXT,
    "birthday" TIMESTAMP(3),
    "preferredBudgetMinCents" INTEGER,
    "preferredBudgetMaxCents" INTEGER,
    "favoriteScenesJson" TEXT NOT NULL DEFAULT '[]',
    "dislikedScentTagsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_scent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPersonaId" TEXT,
    "scentScoresJson" TEXT NOT NULL DEFAULT '{}',
    "likedProductIdsJson" TEXT NOT NULL DEFAULT '[]',
    "dislikedProductIdsJson" TEXT NOT NULL DEFAULT '[]',
    "likedTagsJson" TEXT NOT NULL DEFAULT '[]',
    "dislikedTagsJson" TEXT NOT NULL DEFAULT '[]',
    "lastQuizSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_scent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_products" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productOfferId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_profit_snapshots" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "revenueCents" INTEGER NOT NULL,
    "productCostCents" INTEGER NOT NULL,
    "serviceFeeRevenueCents" INTEGER NOT NULL,
    "shippingRevenueCents" INTEGER NOT NULL,
    "shippingCostCents" INTEGER NOT NULL,
    "paymentFeeCents" INTEGER NOT NULL,
    "couponCostCents" INTEGER NOT NULL,
    "refundCostCents" INTEGER NOT NULL,
    "laborCostCents" INTEGER NOT NULL,
    "affiliateCommissionCents" INTEGER NOT NULL,
    "grossProfitCents" INTEGER NOT NULL,
    "netProfitCents" INTEGER NOT NULL,
    "grossMargin" DOUBLE PRECISION NOT NULL,
    "netMargin" DOUBLE PRECISION NOT NULL,
    "profitStatus" TEXT NOT NULL DEFAULT 'complete',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "order_profit_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ruleJson" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "consentType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "privacy_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_access_logs" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "targetUserId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldsJson" TEXT NOT NULL DEFAULT '[]',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_permissions" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");
CREATE UNIQUE INDEX "user_scent_profiles_userId_key" ON "user_scent_profiles"("userId");
CREATE UNIQUE INDEX "user_favorite_products_userId_productId_key" ON "user_favorite_products"("userId", "productId");
CREATE INDEX "user_favorite_products_userId_idx" ON "user_favorite_products"("userId");
CREATE INDEX "order_profit_snapshots_orderId_calculatedAt_idx" ON "order_profit_snapshots"("orderId", "calculatedAt");
CREATE INDEX "privacy_consents_userId_idx" ON "privacy_consents"("userId");
CREATE INDEX "data_access_logs_resourceType_resourceId_idx" ON "data_access_logs"("resourceType", "resourceId");
CREATE INDEX "data_access_logs_adminUserId_createdAt_idx" ON "data_access_logs"("adminUserId", "createdAt");
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE UNIQUE INDEX "admin_role_permissions_role_permission_key" ON "admin_role_permissions"("role", "permission");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_scent_profiles" ADD CONSTRAINT "user_scent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_favorite_products" ADD CONSTRAINT "user_favorite_products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "privacy_consents" ADD CONSTRAINT "privacy_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

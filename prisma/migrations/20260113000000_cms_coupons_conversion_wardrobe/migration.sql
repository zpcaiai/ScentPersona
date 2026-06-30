-- Batch 4: CMS (50), coupons/referral/membership (51), conversion (52), wardrobe (53)

CREATE TABLE "content_pages" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "subtitle" TEXT,
    "pageType" TEXT NOT NULL DEFAULT 'landing', "status" TEXT NOT NULL DEFAULT 'draft',
    "heroImageUrl" TEXT, "contentBlocksJson" TEXT NOT NULL DEFAULT '[]', "seoTitle" TEXT,
    "seoDescription" TEXT, "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "source" TEXT, "medium" TEXT,
    "landingPageId" TEXT, "startAt" TIMESTAMP(3), "endAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL, "code" TEXT NOT NULL, "type" TEXT NOT NULL, "value" INTEGER NOT NULL,
    "minOrderAmountCents" INTEGER, "maxDiscountCents" INTEGER, "scope" TEXT NOT NULL DEFAULT 'all',
    "startsAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "usageLimit" INTEGER, "perUserLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL, "couponId" TEXT NOT NULL, "userId" TEXT, "orderId" TEXT,
    "discountCents" INTEGER NOT NULL, "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL, "referrerUserId" TEXT NOT NULL, "referredUserId" TEXT,
    "referralCode" TEXT NOT NULL, "rewardType" TEXT NOT NULL, "rewardValue" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "membership_tiers" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "level" INTEGER NOT NULL,
    "benefitsJson" TEXT NOT NULL DEFAULT '[]', "minSpendCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "membership_tiers_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "user_memberships" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "tierId" TEXT, "points" INTEGER NOT NULL DEFAULT 0,
    "totalSpendCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sample_feedback_flows" (
    "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending', "recommendedFullSizeProductId" TEXT,
    "conversionOrderId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "sample_feedback_flows_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "scent_feedbacks" (
    "id" TEXT NOT NULL, "userId" TEXT, "orderId" TEXT, "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0, "likeLevel" TEXT NOT NULL DEFAULT 'neutral',
    "tooSweet" BOOLEAN NOT NULL DEFAULT false, "tooStrong" BOOLEAN NOT NULL DEFAULT false,
    "tooCold" BOOLEAN NOT NULL DEFAULT false, "tooLight" BOOLEAN NOT NULL DEFAULT false,
    "goodForSceneJson" TEXT NOT NULL DEFAULT '[]', "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scent_feedbacks_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "full_size_recommendations" (
    "id" TEXT NOT NULL, "userId" TEXT, "sourceOrderId" TEXT NOT NULL, "productId" TEXT NOT NULL,
    "reason" TEXT NOT NULL, "discountCouponId" TEXT, "status" TEXT NOT NULL DEFAULT 'recommended',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "full_size_recommendations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "scent_wardrobes" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "name" TEXT NOT NULL DEFAULT '我的香味衣橱',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scent_wardrobes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "scent_wardrobe_items" (
    "id" TEXT NOT NULL, "wardrobeId" TEXT NOT NULL, "productId" TEXT NOT NULL, "role" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual', "usageFrequency" TEXT, "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scent_wardrobe_items_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "repurchase_reminders" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "productId" TEXT NOT NULL, "orderId" TEXT,
    "reminderType" TEXT NOT NULL, "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "repurchase_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");
CREATE INDEX "content_pages_status_idx" ON "content_pages"("status");
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupon_redemptions_couponId_idx" ON "coupon_redemptions"("couponId");
CREATE INDEX "coupon_redemptions_userId_idx" ON "coupon_redemptions"("userId");
CREATE UNIQUE INDEX "referral_codes_userId_key" ON "referral_codes"("userId");
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");
CREATE INDEX "referral_rewards_referrerUserId_idx" ON "referral_rewards"("referrerUserId");
CREATE UNIQUE INDEX "membership_tiers_level_key" ON "membership_tiers"("level");
CREATE UNIQUE INDEX "user_memberships_userId_key" ON "user_memberships"("userId");
CREATE UNIQUE INDEX "sample_feedback_flows_orderId_key" ON "sample_feedback_flows"("orderId");
CREATE INDEX "scent_feedbacks_userId_idx" ON "scent_feedbacks"("userId");
CREATE INDEX "scent_feedbacks_productId_idx" ON "scent_feedbacks"("productId");
CREATE INDEX "full_size_recommendations_userId_idx" ON "full_size_recommendations"("userId");
CREATE UNIQUE INDEX "scent_wardrobes_userId_key" ON "scent_wardrobes"("userId");
CREATE INDEX "scent_wardrobe_items_wardrobeId_idx" ON "scent_wardrobe_items"("wardrobeId");
CREATE INDEX "repurchase_reminders_userId_status_idx" ON "repurchase_reminders"("userId", "status");

ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scent_wardrobe_items" ADD CONSTRAINT "scent_wardrobe_items_wardrobeId_fkey" FOREIGN KEY ("wardrobeId") REFERENCES "scent_wardrobes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

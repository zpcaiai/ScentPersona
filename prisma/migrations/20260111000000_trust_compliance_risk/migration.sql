-- Skill 40 (legal/invoice) + Batch 2: trust (42), compliance (43), after-sales (44), risk (45)

CREATE TABLE "business_entity_profiles" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "businessLicenseNo" TEXT,
    "taxNo" TEXT,
    "address" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "serviceScopeJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_entity_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_contract_snapshots" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "legalDocumentType" TEXT NOT NULL,
    "legalDocumentVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedIp" TEXT,
    "acceptedUserAgent" TEXT,
    "contentSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_contract_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL DEFAULT 'personal',
    "title" TEXT NOT NULL,
    "taxNo" TEXT,
    "email" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "issuedAt" TIMESTAMP(3),
    "invoiceUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoice_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_offer_trust_scores" (
    "id" TEXT NOT NULL,
    "productOfferId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "reasonsJson" TEXT NOT NULL DEFAULT '[]',
    "riskFlagsJson" TEXT NOT NULL DEFAULT '[]',
    "recommendationPolicyJson" TEXT NOT NULL DEFAULT '{}',
    "reviewStatus" TEXT NOT NULL DEFAULT 'auto',
    "reviewedBy" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_offer_trust_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cosmetic_compliance_checks" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productOfferId" TEXT,
    "checkStatus" TEXT NOT NULL DEFAULT 'pending',
    "filingNo" TEXT,
    "manufacturer" TEXT,
    "importer" TEXT,
    "originCountry" TEXT,
    "ingredientListJson" TEXT NOT NULL DEFAULT '[]',
    "allergenNotice" TEXT,
    "batchNo" TEXT,
    "shelfLife" TEXT,
    "labelImageUrlsJson" TEXT NOT NULL DEFAULT '[]',
    "riskFlagsJson" TEXT NOT NULL DEFAULT '[]',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cosmetic_compliance_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "after_sales_cases" (
    "id" TEXT NOT NULL,
    "caseNo" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskFlagsJson" TEXT NOT NULL DEFAULT '[]',
    "userDescription" TEXT NOT NULL,
    "adminConclusion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "after_sales_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "after_sales_evidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "text" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "uploadedBy" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "after_sales_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_risk_flags" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phoneHash" TEXT,
    "riskType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_risk_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_risk_flags" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_risk_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risk_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ruleJson" TEXT NOT NULL DEFAULT '{}',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "risk_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "riskFlagsJson" TEXT NOT NULL DEFAULT '[]',
    "reasonsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manual_risk_reviews" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manual_risk_reviews_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "legal_documents_type_isActive_idx" ON "legal_documents"("type", "isActive");
CREATE INDEX "order_contract_snapshots_orderId_idx" ON "order_contract_snapshots"("orderId");
CREATE INDEX "invoice_requests_orderId_idx" ON "invoice_requests"("orderId");
CREATE INDEX "invoice_requests_userId_idx" ON "invoice_requests"("userId");
CREATE UNIQUE INDEX "product_offer_trust_scores_productOfferId_key" ON "product_offer_trust_scores"("productOfferId");
CREATE UNIQUE INDEX "cosmetic_compliance_checks_productId_key" ON "cosmetic_compliance_checks"("productId");
CREATE UNIQUE INDEX "after_sales_cases_caseNo_key" ON "after_sales_cases"("caseNo");
CREATE INDEX "after_sales_cases_orderId_idx" ON "after_sales_cases"("orderId");
CREATE INDEX "after_sales_cases_status_idx" ON "after_sales_cases"("status");
CREATE INDEX "after_sales_evidence_caseId_idx" ON "after_sales_evidence"("caseId");
CREATE INDEX "user_risk_flags_userId_idx" ON "user_risk_flags"("userId");
CREATE INDEX "user_risk_flags_phoneHash_idx" ON "user_risk_flags"("phoneHash");
CREATE INDEX "order_risk_flags_orderId_idx" ON "order_risk_flags"("orderId");
CREATE INDEX "risk_assessments_targetType_targetId_idx" ON "risk_assessments"("targetType", "targetId");
CREATE INDEX "manual_risk_reviews_assessmentId_idx" ON "manual_risk_reviews"("assessmentId");

-- Foreign keys
ALTER TABLE "after_sales_evidence" ADD CONSTRAINT "after_sales_evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "after_sales_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

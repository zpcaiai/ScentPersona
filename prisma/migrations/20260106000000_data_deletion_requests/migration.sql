CREATE TABLE "data_deletion_requests" (
    "id" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

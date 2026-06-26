-- CreateTable
CREATE TABLE "quiz_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "userAgent" TEXT,
    "personaId" TEXT,
    "tagScoresJson" TEXT NOT NULL DEFAULT '{}',
    "recommendedProductIdsJson" TEXT NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "tagScoresJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_intents" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "productType" TEXT NOT NULL,
    "productIdsJson" TEXT NOT NULL DEFAULT '[]',
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "purchaseIntentId" TEXT,
    "personaId" TEXT,
    "favoriteProductId" TEXT,
    "dislikedProductIdsJson" TEXT NOT NULL DEFAULT '[]',
    "ratingsJson" TEXT NOT NULL DEFAULT '{}',
    "comment" TEXT,
    "boughtFullSize" BOOLEAN NOT NULL DEFAULT false,
    "fullSizeProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_metric_snapshots" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "quizStarts" INTEGER NOT NULL DEFAULT 0,
    "quizCompletions" INTEGER NOT NULL DEFAULT 0,
    "purchaseIntents" INTEGER NOT NULL DEFAULT 0,
    "feedbackSubmissions" INTEGER NOT NULL DEFAULT 0,
    "fullSizeConversions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "admin_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

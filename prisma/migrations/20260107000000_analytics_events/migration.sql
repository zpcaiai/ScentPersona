CREATE TABLE "analytics_events" (
  "id" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "source" TEXT,
  "path" TEXT,
  "sessionId" TEXT,
  "orderId" TEXT,
  "personaId" TEXT,
  "metadataJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_eventName_createdAt_idx" ON "analytics_events"("eventName", "createdAt");
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");
CREATE INDEX "analytics_events_orderId_idx" ON "analytics_events"("orderId");

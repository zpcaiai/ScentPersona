-- Batch 3: support (46), notifications (47), inventory (48), fulfillment (49)

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL, "ticketNo" TEXT NOT NULL, "userId" TEXT, "orderId" TEXT,
    "category" TEXT NOT NULL, "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open', "subject" TEXT NOT NULL, "latestMessage" TEXT,
    "assignedTo" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "closedAt" TIMESTAMP(3),
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "senderType" TEXT NOT NULL, "senderId" TEXT,
    "message" TEXT NOT NULL, "attachmentsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "support_templates" (
    "id" TEXT NOT NULL, "category" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "support_templates_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL, "userId" TEXT, "sessionId" TEXT, "orderId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'in_app', "type" TEXT NOT NULL, "title" TEXT NOT NULL,
    "content" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3), "readAt" TIMESTAMP(3), "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL, "type" TEXT NOT NULL, "channel" TEXT NOT NULL,
    "titleTemplate" TEXT NOT NULL, "contentTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "channel" TEXT NOT NULL, "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL, "notificationId" TEXT NOT NULL, "provider" TEXT NOT NULL,
    "providerMessageId" TEXT, "status" TEXT NOT NULL, "errorMessage" TEXT,
    "rawDataJson" TEXT NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "inventory_skus" (
    "id" TEXT NOT NULL, "skuCode" TEXT NOT NULL, "name" TEXT NOT NULL, "productId" TEXT,
    "type" TEXT NOT NULL, "volumeMl" INTEGER, "batchNo" TEXT, "expirationDate" TIMESTAMP(3),
    "stockQuantity" INTEGER NOT NULL DEFAULT 0, "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0, "costCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "inventory_skus_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL, "skuId" TEXT NOT NULL, "type" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL, "relatedOrderId" TEXT, "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sample_kits" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "kitType" TEXT NOT NULL, "priceCents" INTEGER NOT NULL,
    "includedSkuRulesJson" TEXT NOT NULL DEFAULT '[]', "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sample_kits_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "kit_assembly_orders" (
    "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "kitId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', "itemsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kit_assembly_orders_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "fulfillment_orders" (
    "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "fulfillmentNo" TEXT NOT NULL, "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', "warehouse" TEXT, "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fulfillment_orders_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "fulfillment_items" (
    "id" TEXT NOT NULL, "fulfillmentOrderId" TEXT NOT NULL, "skuId" TEXT, "skuName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL, "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "fulfillment_items_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "packing_slips" (
    "id" TEXT NOT NULL, "fulfillmentOrderId" TEXT NOT NULL, "slipNo" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL DEFAULT '{}', "printedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packing_slips_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_tickets_ticketNo_key" ON "support_tickets"("ticketNo");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX "support_tickets_userId_idx" ON "support_tickets"("userId");
CREATE INDEX "support_messages_ticketId_idx" ON "support_messages"("ticketId");
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");
CREATE INDEX "notifications_orderId_idx" ON "notifications"("orderId");
CREATE UNIQUE INDEX "notification_templates_type_channel_key" ON "notification_templates"("type", "channel");
CREATE UNIQUE INDEX "notification_preferences_userId_channel_type_key" ON "notification_preferences"("userId", "channel", "type");
CREATE INDEX "notification_logs_notificationId_idx" ON "notification_logs"("notificationId");
CREATE UNIQUE INDEX "inventory_skus_skuCode_key" ON "inventory_skus"("skuCode");
CREATE INDEX "stock_movements_skuId_createdAt_idx" ON "stock_movements"("skuId", "createdAt");
CREATE INDEX "kit_assembly_orders_orderId_idx" ON "kit_assembly_orders"("orderId");
CREATE UNIQUE INDEX "fulfillment_orders_fulfillmentNo_key" ON "fulfillment_orders"("fulfillmentNo");
CREATE INDEX "fulfillment_orders_orderId_idx" ON "fulfillment_orders"("orderId");
CREATE INDEX "fulfillment_orders_status_idx" ON "fulfillment_orders"("status");
CREATE INDEX "fulfillment_items_fulfillmentOrderId_idx" ON "fulfillment_items"("fulfillmentOrderId");
CREATE UNIQUE INDEX "packing_slips_fulfillmentOrderId_key" ON "packing_slips"("fulfillmentOrderId");

ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "inventory_skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_items" ADD CONSTRAINT "fulfillment_items_fulfillmentOrderId_fkey" FOREIGN KEY ("fulfillmentOrderId") REFERENCES "fulfillment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "packing_slips" ADD CONSTRAINT "packing_slips_fulfillmentOrderId_fkey" FOREIGN KEY ("fulfillmentOrderId") REFERENCES "fulfillment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

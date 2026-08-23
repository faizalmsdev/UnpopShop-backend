-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "industry" TEXT,
    "website" TEXT,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "state" TEXT,
    "city" TEXT,
    "gstNumber" TEXT,
    "certifications" TEXT,
    "exportMarkets" TEXT,
    "productionCapacity" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "subscriptionPlanId" TEXT,
    "listingLimit" INTEGER NOT NULL DEFAULT 5,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceInr" INTEGER NOT NULL,
    "listingLimit" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "images" TEXT,
    "moq" INTEGER,
    "moqUnit" TEXT NOT NULL DEFAULT 'kg',
    "pricePerUnit" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "packagingOptions" TEXT,
    "originState" TEXT,
    "originCountry" TEXT NOT NULL DEFAULT 'India',
    "certifications" TEXT,
    "productionCapacity" TEXT,
    "exportMarkets" TEXT,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "categoryId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ton',
    "destinationCountry" TEXT NOT NULL,
    "specifications" TEXT,
    "certificationsRequired" TEXT,
    "deliveryTimeline" TEXT,
    "additionalRequirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQManufacturerMatch" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQManufacturerMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerQuotation" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "termsNotes" TEXT,
    "certifications" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturerQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalQuotation" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "preparedByAdminId" TEXT NOT NULL,
    "finalPricePerUnit" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "finalTotalPrice" DOUBLE PRECISION NOT NULL,
    "deliveryTimeline" TEXT,
    "terms" TEXT,
    "supplierSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandRecord" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT,
    "categoryId" TEXT,
    "productName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "source" TEXT NOT NULL DEFAULT 'rfq',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "rfqId" TEXT,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "buyerProfileId" TEXT,
    "manufacturerId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ton',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_userId_key" ON "BuyerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturerProfile_userId_key" ON "ManufacturerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_buyerId_productId_key" ON "Favorite"("buyerId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQManufacturerMatch_rfqId_manufacturerId_key" ON "RFQManufacturerMatch"("rfqId", "manufacturerId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturerQuotation_rfqId_manufacturerId_key" ON "ManufacturerQuotation"("rfqId", "manufacturerId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalQuotation_rfqId_key" ON "FinalQuotation"("rfqId");

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerProfile" ADD CONSTRAINT "ManufacturerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerProfile" ADD CONSTRAINT "ManufacturerProfile_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ManufacturerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ManufacturerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQManufacturerMatch" ADD CONSTRAINT "RFQManufacturerMatch_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQManufacturerMatch" ADD CONSTRAINT "RFQManufacturerMatch_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ManufacturerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerQuotation" ADD CONSTRAINT "ManufacturerQuotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerQuotation" ADD CONSTRAINT "ManufacturerQuotation_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ManufacturerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalQuotation" ADD CONSTRAINT "FinalQuotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandRecord" ADD CONSTRAINT "DemandRecord_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ManufacturerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

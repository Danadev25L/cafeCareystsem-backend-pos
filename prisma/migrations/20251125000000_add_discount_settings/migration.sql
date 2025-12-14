-- CreateTable
CREATE TABLE "DiscountSettings" (
    "id" SERIAL NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isPercentage" BOOLEAN NOT NULL DEFAULT true,
    "percentageValue" DOUBLE PRECISION DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAllItems" BOOLEAN NOT NULL DEFAULT true,
    "menuItemIds" JSONB,
    "specificDates" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountSettings_pkey" PRIMARY KEY ("id")
);


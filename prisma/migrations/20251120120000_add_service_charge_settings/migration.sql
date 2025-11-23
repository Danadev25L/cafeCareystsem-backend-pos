-- CreateTable
CREATE TABLE "ServiceChargeSettings" (
    "id" SERIAL NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "chargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isPercentage" BOOLEAN NOT NULL DEFAULT true,
    "percentageValue" DOUBLE PRECISION DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceChargeSettings_pkey" PRIMARY KEY ("id")
);


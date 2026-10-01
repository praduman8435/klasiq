-- CreateEnum
CREATE TYPE "UniformSampleKind" AS ENUM ('SHIRT', 'PANT', 'SKIRT', 'TIE', 'BELT', 'BLAZER', 'SWEATER', 'SOCKS', 'TSHIRT', 'OTHER');

-- CreateEnum
CREATE TYPE "UniformSamplePattern" AS ENUM ('PLAIN', 'CHECK', 'STRIPE');

-- CreateEnum
CREATE TYPE "SchoolEnquiryStatus" AS ENUM ('NEW', 'QUOTED', 'CONFIRMED', 'CLOSED');

-- CreateTable
CREATE TABLE "uniform_samples" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "kind" "UniformSampleKind" NOT NULL,
    "pattern" "UniformSamplePattern" NOT NULL DEFAULT 'PLAIN',
    "colourHex" TEXT NOT NULL,
    "accentHex" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "supplierId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uniform_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_enquiries" (
    "id" TEXT NOT NULL,
    "enquiryNumber" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "city" TEXT,
    "studentCount" INTEGER,
    "classes" TEXT,
    "neededBy" TEXT,
    "message" TEXT,
    "design" JSONB NOT NULL,
    "status" "SchoolEnquiryStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uniform_samples_isActive_kind_sortOrder_idx" ON "uniform_samples"("isActive", "kind", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "school_enquiries_enquiryNumber_key" ON "school_enquiries"("enquiryNumber");

-- CreateIndex
CREATE INDEX "school_enquiries_status_createdAt_idx" ON "school_enquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "school_enquiries_phoneNormalized_createdAt_idx" ON "school_enquiries"("phoneNormalized", "createdAt");

-- AddForeignKey
ALTER TABLE "uniform_samples" ADD CONSTRAINT "uniform_samples_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Same rule as every other table: nothing exposed through Supabase's REST API.
ALTER TABLE "uniform_samples" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "school_enquiries" ENABLE ROW LEVEL SECURITY;

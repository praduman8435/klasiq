-- CreateEnum
CREATE TYPE "SchoolEnquirySchoolType" AS ENUM ('NEW', 'EXISTING');

-- AlterTable
ALTER TABLE "school_enquiries" ADD COLUMN     "distanceMeters" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "schoolType" "SchoolEnquirySchoolType";

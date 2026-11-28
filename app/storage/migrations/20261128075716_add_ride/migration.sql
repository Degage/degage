-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('requested', 'confirmed', 'declined');

-- CreateTable
CREATE TABLE "ride" (
    "id" TEXT NOT NULL,
    "sharedCarId" TEXT NOT NULL,
    "borrowerId" TEXT,
    "status" "RideStatus" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "playReservationId" INTEGER,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ride_playReservationId_key" ON "ride"("playReservationId");

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_sharedCarId_fkey" FOREIGN KEY ("sharedCarId") REFERENCES "shared_car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[degappUserId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "degappUserId" TEXT;

-- CreateTable
CREATE TABLE "shared_car" (
    "id" TEXT NOT NULL,
    "playCarId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "onboardingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_car_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_car_playCarId_key" ON "shared_car"("playCarId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_car_onboardingId_key" ON "shared_car"("onboardingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_degappUserId_key" ON "user"("degappUserId");

-- AddForeignKey
ALTER TABLE "shared_car" ADD CONSTRAINT "shared_car_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_car" ADD CONSTRAINT "shared_car_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "CarOnboarding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

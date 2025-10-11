-- CreateEnum
CREATE TYPE "WeatherProvider" AS ENUM ('WU');

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "weatherProvider" "WeatherProvider",
ADD COLUMN     "weatherStationId" TEXT;

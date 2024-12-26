/*
  Warnings:

  - Made the column `groupId` on table `media` required. This step will fail if there are existing NULL values in that column.
  - Made the column `groupMessageId` on table `media` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `media` DROP FOREIGN KEY `Media_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `media` DROP FOREIGN KEY `Media_groupMessageId_fkey`;

-- DropIndex
DROP INDEX `Media_groupId_fkey` ON `media`;

-- DropIndex
DROP INDEX `Media_groupMessageId_fkey` ON `media`;

-- AlterTable
ALTER TABLE `media` MODIFY `groupId` VARCHAR(191) NOT NULL,
    MODIFY `groupMessageId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_groupMessageId_fkey` FOREIGN KEY (`groupMessageId`) REFERENCES `GroupMessages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

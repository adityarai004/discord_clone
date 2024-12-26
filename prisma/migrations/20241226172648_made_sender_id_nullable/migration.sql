-- DropForeignKey
ALTER TABLE `groupmessages` DROP FOREIGN KEY `GroupMessages_senderId_fkey`;

-- DropIndex
DROP INDEX `GroupMessages_senderId_fkey` ON `groupmessages`;

-- AlterTable
ALTER TABLE `groupmessages` MODIFY `senderId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `GroupMessages` ADD CONSTRAINT `GroupMessages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

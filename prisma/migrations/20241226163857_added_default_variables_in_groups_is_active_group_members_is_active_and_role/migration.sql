-- AlterTable
ALTER TABLE `groupmembers` ALTER COLUMN `memberId` DROP DEFAULT,
    MODIFY `isActive` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE `groups` MODIFY `isActive` BOOLEAN NOT NULL DEFAULT true;

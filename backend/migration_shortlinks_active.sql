USE `shortlink_db`;

ALTER TABLE `shortlinks`
  ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `original_url`;


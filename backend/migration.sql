CREATE DATABASE IF NOT EXISTS `shortlink_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `shortlink_db`;

CREATE TABLE IF NOT EXISTS `shortlinks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(32) NOT NULL,
  `original_url` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


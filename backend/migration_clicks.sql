USE `shortlink_db`;

CREATE TABLE IF NOT EXISTS `clicks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `shortlink_id` INT UNSIGNED NOT NULL,
  `clicked_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_clicked_at` (`clicked_at`),
  KEY `idx_shortlink_id` (`shortlink_id`),
  FOREIGN KEY (`shortlink_id`) REFERENCES `shortlinks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

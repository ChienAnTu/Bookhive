/*
 Navicat Premium Data Transfer

 Source Server         : bookhive
 Source Server Type    : MySQL
 Source Server Version : 80042
 Source Host           : capstone15db.c7u8yy6k6lxl.ap-southeast-2.rds.amazonaws.com:3306
 Source Schema         : BookHive

 Target Server Type    : MySQL
 Target Server Version : 80042
 File Encoding         : 65001

 Date: 30/08/2025 17:35:27
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for book
-- ----------------------------
DROP TABLE IF EXISTS `book`;
CREATE TABLE `book` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_or` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_language` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_img_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condition_img_urls` json DEFAULT NULL,
  `status` enum('listed','unlisted','lent','sold') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'listed',
  `condition` enum('new','like-new','good','fair') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'good',
  `can_rent` tinyint(1) NOT NULL DEFAULT '1',
  `can_sell` tinyint(1) NOT NULL DEFAULT '0',
  `date_added` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isbn` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `publish_year` int DEFAULT NULL,
  `max_lending_days` int NOT NULL DEFAULT '14',
  `delivery_method` enum('post','pickup','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both',
  `sale_price` decimal(10,2) DEFAULT NULL,
  `deposit` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_book_owner` (`owner_id`),
  CONSTRAINT `fk_book_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of book
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `password_hash` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_algo` enum('argon2id','bcrypt','scrypt') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bcrypt',
  `password_set_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `street_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_picture` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `remember_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `terms_accepted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('24a65806-d519-4ebd-92fc-1', NULL, NULL, 'Jinho Jang', 'burnie2569@gmail.com', NULL, NULL, '$2b$12$mz6JBplkOYh0WfizT7NncOdWlLQ8j5NGDamf1AVw5VA10GBHKpmTm', 'bcrypt', '2025-08-24 09:34:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-24 09:34:14', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('9472b332-94aa-485a-a6f7-2', 'swag', 'tt', 'swag', 'swag@example.com', '0412345678', '0000-00-00', '$2b$12$8.HN.aESw850dCsWHP0Fnu5yu8C33Sfr3tedwAq7tZ5IOTCvIvMqq', 'bcrypt', '2025-08-27 14:03:05', NULL, 'string', 'string', 'string', 'string', 'string', 'string', 'string', '2025-08-27 14:03:05', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('d3bb4202-6984-48e7-8a31-a', 'cj', 'zhang', 'zcj', 'zcj@123.com', '0477603581', '1999-02-22', '$2b$12$hbN9t1qLMAv1TM3H5ccO.uNlHkmaV35Kg5zID5wsIHFnoHVNamQ1O', 'bcrypt', '2025-08-30 00:41:16', NULL, 'china', '25 Ewing', 'Perth', 'wa', '8899', '/avatar/111.jpg', '/media/profilePicture/d3bb4202-6984-48e7-8a31-a/2914cfbd8ba54dcdb7ebd6df00eb359e.png', '2025-08-30 00:41:16', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('f261c2c6-4853-47b3-9e5c-3', 'Zhulin', NULL, 'v', 'lyuzhulin@gmail.com', NULL, NULL, '$2b$12$ibp9qsAEfF9eyjpRpTDXSe.ISiHCJEMpXMEk35R3xsEQ/7UjZOiTi', 'bcrypt', '2025-08-28 13:09:16', NULL, 'AU', NULL, 'Perth', 'WA', NULL, 'https://ui-avatars.com/api/?name=v&background=f97316&color=fff', NULL, '2025-08-28 13:09:16', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('fa55f849-c36f-49c6-96ff-d', NULL, NULL, 'christ', 'christ@example.com', NULL, NULL, '$2b$12$IDOUa.E18GwBBBPPZvtFhuETZhdu9OLi1lyVELT7rBbRo/ysXCw4K', 'bcrypt', '2025-08-27 14:57:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-27 14:57:42', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('user-uuid-1234', NULL, NULL, 'Test User', 'test@example.com', NULL, NULL, '$2b$12$examplehashedpassword', 'bcrypt', '2025-08-23 08:14:33', 'Sample Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-23 08:14:33', NULL, NULL, 1);
COMMIT;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `message_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`message_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of messages
-- ----------------------------
BEGIN;
COMMIT;
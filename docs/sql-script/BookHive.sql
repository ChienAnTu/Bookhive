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

 Date: 05/09/2025 19:39:44
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
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('66b0bad9-356f-4f18-8c16-287fe6b9ebb6', '9472b332-94aa-485a-a6f7-2', '挪威的森林', 'Norwegian Wood', 'ja', 'Haruki Murakami', 'string', '', 'string', '[\"string\"]', 'listed', 'good', 1, 0, '2025-08-30 15:00:15', '2025-08-30 15:00:15', 'string', '[\"string\"]', 0, 14, 'both', 0.00, 20.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('9bf4fe56-6a47-4c67-b57c-acef9419083e', 'f261c2c6-4853-47b3-9e5c-3', 'harry', 'Harry Potter2', 'English', 'J.K', 'Sci-Fi', '222', 'https://via.placeholder.com/300x400?text=No+Cover', '[]', 'listed', 'like-new', 1, 0, '2025-09-05 10:00:30', '2025-09-05 10:00:30', NULL, '[]', NULL, 7, 'both', NULL, 16.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('9faf01ef-7732-4fce-95c4-55343ef83ab3', 'f261c2c6-4853-47b3-9e5c-3', 'harry', 'Harry Potter', 'English', 'J.K', 'Fiction', '111', 'https://via.placeholder.com/300x400?text=No+Cover', '[]', 'listed', 'like-new', 1, 0, '2025-09-05 09:51:33', '2025-09-05 09:51:33', NULL, '[]', NULL, 7, 'both', NULL, 16.00);
COMMIT;

-- ----------------------------
-- Table structure for cart
-- ----------------------------
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
  `cart_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of cart
-- ----------------------------
BEGIN;
INSERT INTO `cart` (`cart_id`, `user_id`, `created_at`, `updated_at`) VALUES ('a29da930-645d-41dc-b638-a1df159da4b3', 'd3bb4202-6984-48e7-8a31-a', '2025-09-05 11:02:02', '2025-09-05 11:02:02');
COMMIT;

-- ----------------------------
-- Table structure for cart_item
-- ----------------------------
DROP TABLE IF EXISTS `cart_item`;
CREATE TABLE `cart_item` (
  `cart_item_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cart_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` enum('borrow','purchase') COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `deposit` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of cart_item
-- ----------------------------
BEGIN;
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('3a75190e-72b4-4b3b-9cb5-47d9ef4703c6', 'a29da930-645d-41dc-b638-a1df159da4b3', '1', '2', 'purchase', 12.00, 166.00, '2025-09-05 11:33:35');
COMMIT;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `message_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of messages
-- ----------------------------
BEGIN;
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `timestamp`) VALUES ('86e1eaad-57ea-46d0-9366-9', '27efc134-81d5-45a0-9c47-9', '0f700491-4031-48f4-9988-3', 'hello ashfsadbjkfhskjfhjas', '2025-09-05 06:04:06');
COMMIT;

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notification_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of notifications
-- ----------------------------
BEGIN;
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('26c7a573-27db-4790-a094-8', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:48:34');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('2eaa9f00-d8c6-4b9b-a9d1-9', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:52:07');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('3f7c5a78-d345-46c0-b216-d', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:50:59');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('64aede37-4a40-49c0-affa-2', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:51:57');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('9f02374c-c82c-4896-8c21-8', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:38:48');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('acd78974-4a47-47a4-a38c-a', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:40:23');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('cc82e4eb-b0d1-4125-bca2-7', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:50:19');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('ce09bbd3-3e95-4f9f-b8e8-8', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:38:43');
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
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('0f700491-4031-48f4-9988-3', NULL, NULL, 'vincent', 'vincent@example.com', NULL, NULL, '$2b$12$3gNXcAMBwR6wIR0MPN/RzeuzM9/9TKntcp.YzmpO779lg726TTP1K', 'bcrypt', '2025-09-05 04:30:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 04:30:37', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('24a65806-d519-4ebd-92fc-1', NULL, NULL, 'Jinho Jang', 'burnie2569@gmail.com', NULL, NULL, '$2b$12$mz6JBplkOYh0WfizT7NncOdWlLQ8j5NGDamf1AVw5VA10GBHKpmTm', 'bcrypt', '2025-08-24 09:34:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-24 09:34:14', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('27efc134-81d5-45a0-9c47-9', NULL, NULL, 'thanhvinhtong', 'vinhtongthanh57@gmail.com', NULL, NULL, '$2b$12$L8V65BagVAjBWo2RgsmeYeBUnvJy9jmmGI.DAUkgld6AkCJHrNR9q', 'bcrypt', '2025-09-05 04:30:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 04:30:46', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('9472b332-94aa-485a-a6f7-2', 'swag', 'tt', 'swag', 'swag@example.com', '0412345678', '0000-00-00', '$2b$12$8.HN.aESw850dCsWHP0Fnu5yu8C33Sfr3tedwAq7tZ5IOTCvIvMqq', 'bcrypt', '2025-08-27 14:03:05', NULL, 'string', 'string', 'string', 'string', 'string', 'string', 'string', '2025-08-27 14:03:05', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('d3bb4202-6984-48e7-8a31-a', 'cj', 'zhang', 'zcj', 'zcj@123.com', '0477603581', '1999-02-22', '$2b$12$hbN9t1qLMAv1TM3H5ccO.uNlHkmaV35Kg5zID5wsIHFnoHVNamQ1O', 'bcrypt', '2025-08-30 00:41:16', NULL, 'china', '25 Ewing', 'Perth', 'wa', '8899', '/avatar/111.jpg', '/media/profilePicture/d3bb4202-6984-48e7-8a31-a/2914cfbd8ba54dcdb7ebd6df00eb359e.png', '2025-08-30 00:41:16', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('f261c2c6-4853-47b3-9e5c-3', 'Veronica', 'Lyu', 'Veronica Lyu', 'lyuzhulin@gmail.com', '0491170217', NULL, '$2b$12$ibp9qsAEfF9eyjpRpTDXSe.ISiHCJEMpXMEk35R3xsEQ/7UjZOiTi', 'bcrypt', '2025-08-28 13:09:16', NULL, 'AU', '11', 'Perth', 'WA', '6000', 'https://ui-avatars.com/api/?name=v&background=f97316&color=fff', NULL, '2025-08-28 13:09:16', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('fa55f849-c36f-49c6-96ff-d', NULL, NULL, 'christ', 'christ@example.com', NULL, NULL, '$2b$12$IDOUa.E18GwBBBPPZvtFhuETZhdu9OLi1lyVELT7rBbRo/ysXCw4K', 'bcrypt', '2025-08-27 14:57:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-27 14:57:42', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('fc635042-01ae-46b5-947c-1', NULL, NULL, 'simon', 'nomapsimon@gmail.com', NULL, NULL, '$2b$12$uFhDM2yycQy4XmqwzOHvOeQpAFvNsVRmljjpqi40mMR8KMw/aHBh2', 'bcrypt', '2025-09-05 07:56:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 07:56:55', NULL, NULL, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`) VALUES ('user-uuid-1234', NULL, NULL, 'Test User', 'test@example.com', NULL, NULL, '$2b$12$examplehashedpassword', 'bcrypt', '2025-08-23 08:14:33', 'Sample Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-23 08:14:33', NULL, NULL, 1);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;

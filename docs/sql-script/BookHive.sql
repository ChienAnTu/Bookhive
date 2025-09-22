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

 Date: 12/09/2025 21:43:44
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for alembic_version
-- ----------------------------
DROP TABLE IF EXISTS `alembic_version`;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of alembic_version
-- ----------------------------
BEGIN;
INSERT INTO `alembic_version` (`version_num`) VALUES ('d5f50ba3f943');
COMMIT;

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
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('166b4e6e-8ce7-4eeb-9ece-1722baf10126', '992f8baa-49e9-43f6-b1cd-f', 'The Design of Everyday Things', 'The Design of Everyday Things', 'English', 'Don Norman', 'Design', 'A powerful primer on how design serves as the communication between object and user, and how to optimize that conduit of communication.', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop', '[]', 'listed', 'good', 1, 0, '2025-09-11 13:04:35', '2025-09-11 13:04:35', '', '[\"UX design\", \"usability\", \"human-centered design\", \"technology\"]', 1988, 21, 'pickup', NULL, 13.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('18e569b2-bb0b-4e4b-9506-fd1c6084a2c1', 'c894a2bb-2701-41ad-af2b-e', 'The Midnight Library', 'The Midnight Library', 'English', 'Matt Haig', 'Fiction', 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', '[]', 'listed', 'like-new', 1, 0, '2025-09-11 13:06:37', '2025-09-11 13:06:37', '', '[\"life choices\", \"parallel lives\", \"self-reflection\", \"existential\"]', 2020, 21, 'both', NULL, 15.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('38c29596-cc16-48a6-8abd-375ae5d95fd1', 'ed5e5a1b-ca7a-4c24-8188-2', 'test book S', 'Romantic story', 'Chinese', 'Zhenyi Su', 'Sci-Fi', 'extremely good. Worth reading in your life!', 'https://via.placeholder.com/300x400?text=No+Cover', '[\"blob:http://localhost:3000/b38b32a4-190a-42d4-8934-cd41277951d3\"]', 'listed', 'new', 1, 0, '2025-09-10 13:39:54', '2025-09-10 13:39:54', NULL, '[\"lgbtq\"]', 2025, 14, 'both', NULL, 50.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('3e255cb6-3920-4865-a0b3-953cf6489652', 'c06bf7ed-7ad9-4103-a3ab-0', 'The Alchemist', 'The Alchemist', 'English', 'Paulo Coelho', 'Fiction', 'A philosophical novel about a young shepherd\'s journey to find treasure, discovering the importance of following one\'s dreams.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', '[]', 'listed', 'good', 1, 0, '2025-09-11 13:09:44', '2025-09-11 13:09:44', '', '[\"dreams\", \"journey\", \"philosophy\", \"self-discovery\"]', 1988, 18, 'both', NULL, 12.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('3ec3d122-b395-4cbb-9844-0ffa37d206b1', 'b06c07fe-a6c5-4c43-8d4d-7', 'Becoming', 'Becoming', 'English', 'Michelle Obama', 'Biography', 'The intimate, powerful memoir of the former First Lady of the United States, chronicling her journey from Chicago\'s South Side to the White House.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', '[]', 'listed', 'like-new', 1, 0, '2025-09-11 13:12:20', '2025-09-11 13:12:20', '', '[\"inspiration\", \"leadership\", \"family\", \"politics\"]', 2018, 21, 'both', NULL, 20.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('42472cb0-8485-4e81-8776-cc1c5ddadd5f', '992f8baa-49e9-43f6-b1cd-f', 'Dune', 'Dune', 'English', 'Frank Herbert', 'Sci-Fi', 'Set on the desert planet Arrakis, this epic tale follows young Paul Atreides as he navigates a complex web of politics, religion, and mysticism.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', '[]', 'lent', 'like-new', 1, 0, '2025-09-11 13:03:33', '2025-09-11 13:03:33', '', '[\"desert planet\", \"politics\", \"mysticism\", \"classic sci-fi\"]', 1965, 30, 'pickup', NULL, 18.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('4eeb1ebf-f47d-440c-9412-214ff775661d', 'f258cd66-e81d-4620-9655-5', '1984', '1984', 'English', 'George Orwell', 'Fiction', 'A dystopian social science fiction novel about totalitarian rule and the struggle for truth and freedom in a surveillance state.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', '[]', 'listed', 'fair', 1, 0, '2025-09-11 13:15:05', '2025-09-11 13:15:05', '', '[\"dystopia\", \"surveillance\", \"freedom\", \"classic literature\"]', 1949, 28, 'pickup', NULL, 10.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('5fa2381c-8b4f-44b8-bb8a-2aa65c45fdf7', 'c06bf7ed-7ad9-4103-a3ab-0', 'The Seven Husbands of Evelyn Hugo', 'The Seven Husbands of Evelyn Hugo', 'English', 'Taylor Jenkins Reid', 'Fiction', 'Reclusive Hollywood icon Evelyn Hugo finally decides to tell her life story—but only to unknown journalist Monique Grant.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', '[]', 'listed', 'good', 1, 1, '2025-09-11 13:09:35', '2025-09-11 13:09:35', '', '[\"Hollywood\", \"biography\", \"love story\", \"secrets\"]', 2017, 21, 'both', 20.00, 14.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('66b0bad9-356f-4f18-8c16-287fe6b9ebb6', '9472b332-94aa-485a-a6f7-2', '挪威的森林', 'Norwegian Wood', 'ja', 'Haruki Murakami', 'string', '', 'string', '[\"string\"]', 'unlisted', 'good', 1, 0, '2025-08-30 15:00:15', '2025-09-06 15:55:02', 'string', '[\"string\"]', 0, 14, 'both', 0.00, 20.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('6b539673-51da-473c-ba7b-22a1d1cea9cd', 'f258cd66-e81d-4620-9655-5', 'Norwegian Wood', 'Norwegian Wood', 'English', 'Haruki Murakami', 'Fiction', 'A nostalgic story of loss and burgeoning sexuality set in late 1960s Tokyo, following student Toru Watanabe as he remembers his past.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop', '[]', 'listed', 'like-new', 1, 0, '2025-09-11 13:14:59', '2025-09-11 13:14:59', '', '[\"Tokyo\", \"1960s\", \"love\", \"memory\", \"Japanese literature\"]', 1987, 21, 'both', NULL, 16.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('6d598f08-cdde-4fff-91fa-76bce751f7bc', 'fc635042-01ae-46b5-947c-1', 'harry5', 'Harry Potter5', 'Chinese', 'J.K', 'Fiction', '555', 'blob:http://localhost:3000/ce21c005-5f4c-43aa-bc10-3c55235b40ee', '[]', 'listed', 'like-new', 1, 0, '2025-09-06 05:58:24', '2025-09-06 05:58:24', NULL, '[\"UK\"]', NULL, 14, 'both', NULL, 16.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('7bddaa09-c009-4a3a-9855-29870ae2a67b', 'c894a2bb-2701-41ad-af2b-e', 'Where the Crawdads Sing', 'Where the Crawdads Sing', 'English', 'Delia Owens', 'Fiction', 'A coming-of-age story about a girl who raised herself in the marshes of North Carolina, becoming a naturalist and prime suspect in a murder case.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop', '[]', 'listed', 'good', 1, 0, '2025-09-11 13:07:20', '2025-09-11 13:07:20', '', '[\"nature\", \"mystery\", \"isolation\", \"coming of age\"]', 2018, 21, 'post', NULL, 15.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('91c2d92d-70e8-4254-88f2-ef8ffac25e91', 'c06bf7ed-7ad9-4103-a3ab-0', 'Atomic Habits', 'Atomic Habits', 'English', 'James Clear', 'Self-Help', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Transform your life with tiny changes in behavior that deliver remarkable results.', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop', '[]', 'listed', 'good', 1, 1, '2025-09-11 13:09:22', '2025-09-11 13:09:22', '', '[\"habits\", \"productivity\", \"self-improvement\", \"psychology\"]', 2018, 14, 'post', 25.00, 12.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('976f3d69-f024-42ad-930a-e8cc2a747678', '992f8baa-49e9-43f6-b1cd-f', 'Project Hail Mary', 'Project Hail Mary', 'English', 'Andy Weir', 'Sci-Fi', 'Ryland Grace wakes up on a spaceship with no memory of why he\'s there. His crewmates are dead and he\'s apparently humanity\'s last hope.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', '[]', 'listed', 'like-new', 1, 0, '2025-09-11 13:04:06', '2025-09-11 13:04:06', '', '[\"space\", \"mystery\", \"survival\", \"humor\"]', 2021, 21, 'both', NULL, 17.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('b093dd46-20b1-442e-b21f-7e8e17fcdd93', 'f261c2c6-4853-47b3-9e5c-3', 'harry Potter', 'Harry Potter6', 'English', 'J.K', 'Sci-Fi', '666666666', 'http://localhost:8000/media/f261c2c6-4853-47b3-9e5c-3/book/a1fa1a33824e4b25a73a0265d786b951.jpg', '[\"http://localhost:8000/media/f261c2c6-4853-47b3-9e5c-3/book/29d8aded0f204a4b9353dfa1149b85cb.jpg\", \"http://localhost:8000/media/f261c2c6-4853-47b3-9e5c-3/book/afe1076ee32a4e62aa19b9adaf159fa3.jpg\"]', 'listed', 'like-new', 1, 1, '2025-09-11 13:02:49', '2025-09-11 13:39:16', NULL, '[\"uk\", \"magic\"]', NULL, 14, 'both', 25.00, 25.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('c1c7b0f5-1ed7-4e32-a4f7-ecaa4b4cad99', 'c894a2bb-2701-41ad-af2b-e', 'Sapiens', 'Sapiens', 'English', 'Yuval Noah Harari', 'History', 'A brief history of humankind, exploring how Homo sapiens came to dominate the world through cognitive, agricultural, and scientific revolutions.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', '[]', 'listed', 'like-new', 1, 0, '2025-09-11 13:06:49', '2025-09-11 13:06:49', '', '[\"human evolution\", \"civilization\", \"anthropology\", \"thought-provoking\"]', 2011, 28, 'post', NULL, 16.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('c8c14762-14ac-416d-ae56-eb5dac809de2', '992f8baa-49e9-43f6-b1cd-f', 'The Midnight Library', 'The Midnight Library', 'English', 'Matt Haig', 'Fiction', 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', '[]', 'listed', 'like-new', 1, 0, '2025-09-11 12:50:56', '2025-09-11 12:50:56', '', '[\"life choices\", \"parallel lives\", \"self-reflection\", \"existential\"]', 2020, 21, 'both', NULL, 15.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('e6922ac7-e218-4157-843d-dc7fcaf1255f', '9472b332-94aa-485a-a6f7-2', '挪威的森林A', 'Norwegian Wood', 'Japanese', 'Haruki Murakami', 'Fiction', 'aserbeaab', 'blob:http://localhost:3000/b7864c1d-b83d-4874-8989-ef84752b0b11', '[\"blob:http://localhost:3000/d0582f9d-5fce-43d1-8484-bc504dc26b3a\"]', 'listed', 'good', 1, 1, '2025-09-06 15:52:12', '2025-09-11 12:07:36', '123wefr3gq33grs3g', '[\"qwer\", \"asf\", \"ttrt1\", \"124\"]', 2019, 14, 'both', 10.00, 22.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('e6b9ea61-47bf-4b94-aa87-c019fb0892e3', '992f8baa-49e9-43f6-b1cd-f', 'Dune', 'Dune', 'English', 'Frank Herbert', 'Sci-Fi', 'Set on the desert planet Arrakis, this epic tale follows young Paul Atreides as he navigates a complex web of politics, religion, and mysticism.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', '[]', 'lent', 'like-new', 1, 0, '2025-09-11 13:01:17', '2025-09-11 13:01:17', '', '[\"desert planet\", \"politics\", \"mysticism\", \"classic sci-fi\"]', 1965, 30, 'pickup', NULL, 18.00);
INSERT INTO `book` (`id`, `owner_id`, `title_or`, `title_en`, `original_language`, `author`, `category`, `description`, `cover_img_url`, `condition_img_urls`, `status`, `condition`, `can_rent`, `can_sell`, `date_added`, `update_date`, `isbn`, `tags`, `publish_year`, `max_lending_days`, `delivery_method`, `sale_price`, `deposit`) VALUES ('f41f763f-f7f0-41c9-a4cf-d83746371482', 'b06c07fe-a6c5-4c43-8d4d-7', 'Educated', 'Educated', 'English', 'Tara Westover', 'Biography', 'A memoir about a woman who grows up in a survivalist family in rural Idaho and eventually earns a PhD from Cambridge University.', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop', '[]', 'listed', 'like-new', 1, 0, '2025-09-11 13:12:14', '2025-09-11 13:12:14', '', '[\"education\", \"family\", \"resilience\", \"transformation\"]', 2018, 25, 'both', NULL, 18.00);
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
INSERT INTO `cart` (`cart_id`, `user_id`, `created_at`, `updated_at`) VALUES ('234b92e7-0f10-47bf-a784-871b9255fdb9', 'ed5e5a1b-ca7a-4c24-8188-2', '2025-09-12 07:54:22', '2025-09-12 07:54:22');
INSERT INTO `cart` (`cart_id`, `user_id`, `created_at`, `updated_at`) VALUES ('a29da930-645d-41dc-b638-a1df159da4b3', 'd3bb4202-6984-48e7-8a31-a', '2025-09-05 11:02:02', '2025-09-05 11:02:02');
INSERT INTO `cart` (`cart_id`, `user_id`, `created_at`, `updated_at`) VALUES ('e2889ee8-58f2-478b-89d9-749398c7471d', 'f261c2c6-4853-47b3-9e5c-3', '2025-09-11 08:43:41', '2025-09-11 08:43:41');
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
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('019b1e8a-cbdd-43fb-8538-0fa41f0e65c2', 'a29da930-645d-41dc-b638-a1df159da4b3', '6b539673-51da-473c-ba7b-22a1d1cea9cd', 'f258cd66-e81d-4620-9655-5', 'borrow', 0.00, 16.00, '2025-09-12 09:08:32');
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('1c57f150-de79-4a75-b1cf-dcd71da55b6f', '234b92e7-0f10-47bf-a784-871b9255fdb9', '38c29596-cc16-48a6-8abd-375ae5d95fd1', 'ed5e5a1b-ca7a-4c24-8188-2', 'borrow', 0.00, 50.00, '2025-09-12 07:54:43');
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('1c9c8396-70d6-4aad-a418-9872718a8ec3', '234b92e7-0f10-47bf-a784-871b9255fdb9', 'b093dd46-20b1-442e-b21f-7e8e17fcdd93', 'f261c2c6-4853-47b3-9e5c-3', 'borrow', 25.00, 25.00, '2025-09-12 07:54:51');
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('2bef94d1-f72f-4aed-ad8a-b35ad0fe269b', 'e2889ee8-58f2-478b-89d9-749398c7471d', '6b539673-51da-473c-ba7b-22a1d1cea9cd', 'f258cd66-e81d-4620-9655-5', 'borrow', 0.00, 16.00, '2025-09-12 09:14:19');
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('7b4a2c90-444c-49f5-ac12-3c0ba416137f', 'e2889ee8-58f2-478b-89d9-749398c7471d', '3ec3d122-b395-4cbb-9844-0ffa37d206b1', 'b06c07fe-a6c5-4c43-8d4d-7', 'borrow', 0.00, 20.00, '2025-09-12 09:14:36');
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('7e392c7d-c20d-40b0-b44d-82a98d6efa65', 'e2889ee8-58f2-478b-89d9-749398c7471d', '4eeb1ebf-f47d-440c-9412-214ff775661d', 'f258cd66-e81d-4620-9655-5', 'borrow', 0.00, 10.00, '2025-09-11 16:50:55');
INSERT INTO `cart_item` (`cart_item_id`, `cart_id`, `book_id`, `owner_id`, `action_type`, `price`, `deposit`, `created_at`) VALUES ('f4e65d12-6965-4265-b114-49ef0c0f77e7', 'a29da930-645d-41dc-b638-a1df159da4b3', '4eeb1ebf-f47d-440c-9412-214ff775661d', 'f258cd66-e81d-4620-9655-5', 'borrow', 0.00, 10.00, '2025-09-12 09:08:26');
COMMIT;

-- ----------------------------
-- Table structure for checkout
-- ----------------------------
DROP TABLE IF EXISTS `checkout`;
CREATE TABLE `checkout` (
  `checkout_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `street` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postcode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deposit` decimal(10,2) DEFAULT '0.00',
  `service_fee` decimal(10,2) DEFAULT '0.00',
  `shipping_fee` decimal(10,2) DEFAULT '0.00',
  `total_due` decimal(10,2) DEFAULT '0.00',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`checkout_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of checkout
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for checkout_item
-- ----------------------------
DROP TABLE IF EXISTS `checkout_item`;
CREATE TABLE `checkout_item` (
  `item_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkout_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `deposit` decimal(10,2) DEFAULT NULL,
  `shipping_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_quote` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `checkout_id` (`checkout_id`),
  CONSTRAINT `checkout_item_ibfk_1` FOREIGN KEY (`checkout_id`) REFERENCES `checkout` (`checkout_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of checkout_item
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for complaint
-- ----------------------------
DROP TABLE IF EXISTS `complaint`;
CREATE TABLE `complaint` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) DEFAULT NULL,
  `complainant_id` varchar(25) NOT NULL,
  `respondent_id` varchar(25) DEFAULT NULL,
  `type` enum('book-condition','delivery','user-behavior','other') NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','investigating','resolved','closed') NOT NULL DEFAULT 'pending',
  `admin_response` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_complainant` (`complainant_id`),
  KEY `idx_respondent` (`respondent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of complaint
-- ----------------------------
BEGIN;
INSERT INTO `complaint` (`id`, `order_id`, `complainant_id`, `respondent_id`, `type`, `subject`, `description`, `status`, `admin_response`, `created_at`, `updated_at`) VALUES ('effd9d35-53cb-4380-a1a9-088209df3948', NULL, '9472b332-94aa-485a-a6f7-2', 'swag', 'book-condition', 'Cover damaged', 'Cover torn on arrival', 'investigating', 'We are checking with the lender.', '2025-09-10 08:14:40', '2025-09-10 08:36:42');
COMMIT;

-- ----------------------------
-- Table structure for complaint_message
-- ----------------------------
DROP TABLE IF EXISTS `complaint_message`;
CREATE TABLE `complaint_message` (
  `id` varchar(36) NOT NULL,
  `complaint_id` varchar(36) NOT NULL,
  `sender_id` varchar(25) NOT NULL,
  `body` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cid` (`complaint_id`),
  CONSTRAINT `fk_msg_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of complaint_message
-- ----------------------------
BEGIN;
INSERT INTO `complaint_message` (`id`, `complaint_id`, `sender_id`, `body`, `created_at`) VALUES ('9afb7dde-6ff7-4df6-8b70-7221a85d930b', 'effd9d35-53cb-4380-a1a9-088209df3948', '9472b332-94aa-485a-a6f7-2', 'Please check attached photos.', '2025-09-10 08:19:59');
COMMIT;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `message_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_id` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
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
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('16c84c51-2bda-4da7-a572-3', '27efc134-81d5-45a0-9c47-9', '0f700491-4031-48f4-9988-3', 'heheheheheheheheheh 20250907', NULL, '2025-09-07 01:49:31', 0);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('37f91a7f-8965-44aa-8838-1', '2a9e4c0f-ac6d-4eef-b1ba-5', '0f700491-4031-48f4-9988-3', '123456', NULL, '2025-09-07 01:53:12', 0);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('3f305a3b-1898-43a2-89f0-0', '27efc134-81d5-45a0-9c47-9', '0f700491-4031-48f4-9988-3', '123456', NULL, '2025-09-06 13:16:52', 1);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('5dfa6372-2849-46b5-95f6-4', '27efc134-81d5-45a0-9c47-9', '0f700491-4031-48f4-9988-3', '123456', NULL, '2025-09-06 13:16:50', 1);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('61a88535-2f66-45d0-8aea-c', '0f700491-4031-48f4-9988-3', '27efc134-81d5-45a0-9c47-9', 'test uploading image in a chat', '/media/messageAttachments/0f700491-4031-48f4-9988-3/fe91eeb94f1b46468d01a03f7a4b015d.gif', '2025-09-11 18:05:12', 0);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('665d9a79-cfbd-46f3-b0e7-e', '27efc134-81d5-45a0-9c47-9', '0f700491-4031-48f4-9988-3', 'heheheheheheheheheh 20250907 333333333', NULL, '2025-09-07 01:50:29', 0);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('7623f82b-d266-4510-811d-5', '27efc134-81d5-45a0-9c47-9', '0f700491-4031-48f4-9988-3', 'hehehehehehe', NULL, '2025-09-06 13:17:59', 1);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('9e39c77c-e0b5-431a-b0fd-4', '2a9e4c0f-ac6d-4eef-b1ba-5', '0f700491-4031-48f4-9988-3', 'hello sunday', NULL, '2025-09-07 02:04:08', 0);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('c2ce1629-718a-4a4a-867c-f', '0f700491-4031-48f4-9988-3', '27efc134-81d5-45a0-9c47-9', 'asdfjkjafhhsdkjfhsafhkjshfkjshkafjhsajfhskfjkshafs', NULL, '2025-09-07 02:43:22', 0);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('e1a708c8-5dc7-48e3-a5c2-6', '0f700491-4031-48f4-9988-3', '27efc134-81d5-45a0-9c47-9', 'hello', NULL, '2025-09-07 02:40:53', 0);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('f7721124-d0fd-43b2-a1c2-6', '27efc134-81d5-45a0-9c47-9', '0f700491-4031-48f4-9988-3', 'heheheheheheheheheh 20250907 222222222', NULL, '2025-09-07 01:49:51', 1);
INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `image_path`, `timestamp`, `is_read`) VALUES ('fd14288c-cf17-4429-b4d4-7', '0f700491-4031-48f4-9988-3', '27efc134-81d5-45a0-9c47-9', 'testrealtime', NULL, '2025-09-07 02:41:24', 0);
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
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('2ae6c7c5-39f4-4646-8cfc-e', '27efc134-81d5-45a0-9c47-9', '12313131231', 'updated terms', 'terms', 0, '2025-09-07 02:08:48');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('2eaa9f00-d8c6-4b9b-a9d1-9', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:52:07');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('3a509a47-6fec-4604-827e-1', '27efc134-81d5-45a0-9c47-9', 'asasa', 'hello', 'test', 0, '2025-09-07 02:22:53');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('3f7c5a78-d345-46c0-b216-d', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:50:59');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('64aede37-4a40-49c0-affa-2', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:51:57');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('9f02374c-c82c-4896-8c21-8', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:38:48');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('acd78974-4a47-47a4-a38c-a', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:40:23');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('cc82e4eb-b0d1-4125-bca2-7', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:50:19');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('ce09bbd3-3e95-4f9f-b8e8-8', '0f700491-4031-48f4-9988-3', 'test noti', 'notify regarding notification system', 'noti', 0, '2025-09-05 06:38:43');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('d6160377-25c8-4832-af7e-5', '27efc134-81d5-45a0-9c47-9', 'asasa', 'hello', 'test', 0, '2025-09-07 02:20:43');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('eb8138d6-1870-476d-bbde-b', '35bddc78-9f5a-4751-ad1a-a', '12313131231', 'updated terms', 'terms', 0, '2025-09-07 02:10:50');
INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `timestamp`) VALUES ('fff2433f-5920-439f-b6e3-e', '27efc134-81d5-45a0-9c47-9', 'asasa', 'hello', 'test', 0, '2025-09-07 02:21:58');
COMMIT;

-- ----------------------------
-- Table structure for order_books
-- ----------------------------
DROP TABLE IF EXISTS `order_books`;
CREATE TABLE `order_books` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_book` (`order_id`,`book_id`),
  KEY `ix_order_books_book_id` (`book_id`),
  KEY `ix_order_books_order_id` (`order_id`),
  CONSTRAINT `order_books_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_books_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of order_books
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `borrower_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING_PAYMENT','PENDING_SHIPMENT','BORROWING','OVERDUE','RETURNED','COMPLETED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_at` datetime DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `canceled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime NOT NULL DEFAULT (now()),
  `delivery_method` enum('post','pickup') COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_out_carrier` enum('AUSPOST','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_out_tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_out_tracking_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_return_carrier` enum('AUSPOST','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_return_tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_return_tracking_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_amount` int NOT NULL,
  `service_fee_amount` int NOT NULL,
  `shipping_out_fee_amount` int DEFAULT NULL,
  `sale_price_amount` int DEFAULT NULL,
  `late_fee_amount` int DEFAULT NULL,
  `damage_fee_amount` int DEFAULT NULL,
  `total_paid_amount` int NOT NULL,
  `total_refunded_amount` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `ix_orders_borrower_id` (`borrower_id`),
  KEY `ix_orders_owner_id` (`owner_id`),
  KEY `ix_orders_status` (`status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of orders
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for service_fee
-- ----------------------------
DROP TABLE IF EXISTS `service_fee`;
CREATE TABLE `service_fee` (
  `fee_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `fee_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fee_id`),
  UNIQUE KEY `fee_id` (`fee_id`),
  CONSTRAINT `service_fee_chk_1` CHECK ((`fee_type` in (_utf8mb4'FIXED',_utf8mb4'PERCENT'))),
  CONSTRAINT `service_fee_chk_2` CHECK ((`value` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of service_fee
-- ----------------------------
BEGIN;
INSERT INTO `service_fee` (`fee_id`, `name`, `description`, `fee_type`, `value`, `status`, `created_at`, `updated_at`) VALUES ('6fc9f5e5-08f8-4447-8084-0d3a984c1db8', 'platform service fee', 'fee for the whole service', 'PERCENT', 10.00, 1, '2025-09-12 12:30:26', '2025-09-12 12:30:26');
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
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('0f700491-4031-48f4-9988-3', NULL, NULL, 'vincent', 'vincent@example.com', NULL, NULL, '$2b$12$3gNXcAMBwR6wIR0MPN/RzeuzM9/9TKntcp.YzmpO779lg726TTP1K', 'bcrypt', '2025-09-05 04:30:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 04:30:37', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('24a65806-d519-4ebd-92fc-1', NULL, NULL, 'Jinho Jang', 'burnie2569@gmail.com', NULL, NULL, '$2b$12$mz6JBplkOYh0WfizT7NncOdWlLQ8j5NGDamf1AVw5VA10GBHKpmTm', 'bcrypt', '2025-08-24 09:34:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-24 09:34:14', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('27efc134-81d5-45a0-9c47-9', NULL, NULL, 'thanhvinhtong', 'vinhtongthanh57@gmail.com', NULL, NULL, '$2b$12$L8V65BagVAjBWo2RgsmeYeBUnvJy9jmmGI.DAUkgld6AkCJHrNR9q', 'bcrypt', '2025-09-05 04:30:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 04:30:46', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('2a9e4c0f-ac6d-4eef-b1ba-5', NULL, NULL, 'test_message', 'test_message@example.com', NULL, NULL, '$2b$12$3tYZ8dNawgP2ZrGT2oOGN.w/2ewoD33oAGv9YYXOXupl4YM0rtp9O', 'bcrypt', '2025-09-07 01:52:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 01:52:31', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('35bddc78-9f5a-4751-ad1a-a', NULL, NULL, 'test_notification', 'dukich1003@gmail.com', NULL, NULL, '$2b$12$ciUN4/diRBZaNTYvveB.v.4DqaFDADdsnx9nAPoizbOCgr6Gzrv2y', 'bcrypt', '2025-09-07 02:10:11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 02:10:11', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('5cfdb445-0456-40e9-ae07-2', NULL, NULL, 'ct', 'ct@mail.com.au', NULL, NULL, '$2b$12$ZZl46E2nTMCX.k6oG8WRXOcqpAnQLH7atRIqUuG1db1Z5ymRdUOIu', 'bcrypt', '2025-09-06 14:25:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-06 14:25:40', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('9472b332-94aa-485a-a6f7-2', 'swag', 'tt', 'swag tt', 'swag@example.com', '0412345678', '0000-00-00', '$2b$12$8.HN.aESw850dCsWHP0Fnu5yu8C33Sfr3tedwAq7tZ5IOTCvIvMqq', 'bcrypt', '2025-08-27 14:03:05', NULL, 'string', 'string', 'string', 'string', 'string', 'string', 'string', '2025-08-27 14:03:05', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('992f8baa-49e9-43f6-b1cd-f', 'Alice', 'Wang', 'Alice Wang', 'alice@example.com', '+61 400 123 456', '1995-03-12', '$2b$12$Ma.Nrav/Bi7Z5IN2v.wBO.yrbDpcos9dhYgW4cFRPdgr0MCqFMcQK', 'bcrypt', '2025-09-11 12:47:38', NULL, 'Australia', '123 George St', 'Sydney', 'NSW', '2000', '', '', '2025-09-11 12:47:38', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('admin', NULL, NULL, 'Administrator', 'admin@test.com', NULL, NULL, '$2b$12$8.HN.aESw850dCsWHP0Fnu5yu8C33Sfr3tedwAq7tZ5IOTCvIvMqq', 'bcrypt', '2025-09-10 08:34:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 08:34:22', NULL, NULL, 1, 1);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('b06c07fe-a6c5-4c43-8d4d-7', 'Elena', 'Zhang', 'Elena Zhang', 'elena@example.com', '+61 411 555 888', '1992-09-15', '$2b$12$Qe69ta.edf22qWE5KmD0ROLDKBt03EPhbE2Qd82ydx5znasKbDymy', 'bcrypt', '2025-09-11 13:11:11', NULL, 'Australia', '50 King St', 'Perth', 'WA', '6000', '', '', '2025-09-11 13:11:11', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('c06bf7ed-7ad9-4103-a3ab-0', 'Sophia', 'Li', 'Sophia Li', 'sophia@example.com', '+61 422 765 321', '1998-11-05', '$2b$12$Nq4SZDdQcHgJ230KuDh2SesELXy5aoJGQwG87Xwp3I7PEoG6uCEc.', 'bcrypt', '2025-09-11 13:08:13', NULL, 'Australia', '78 Queen St', 'Brisbane', 'QLD', '4000', '', '', '2025-09-11 13:08:13', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('c894a2bb-2701-41ad-af2b-e', 'David', 'Chen', 'David Chen', 'david@example.com', '+61 433 987 654', '1990-07-24', '$2b$12$3cUQKVxpdQrz9JN6yRIjsemZGcffh5byKyCtgnz6F4OrLgQh6ebzK', 'bcrypt', '2025-09-11 13:05:11', NULL, 'Australia', '45 Collins St', 'Melbourne', 'VIC', '3000', '', '', '2025-09-11 13:05:11', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('d3bb4202-6984-48e7-8a31-a', 'cj', 'zhang', 'zcj', 'zcj@123.com', '0477603581', '1999-02-22', '$2b$12$hbN9t1qLMAv1TM3H5ccO.uNlHkmaV35Kg5zID5wsIHFnoHVNamQ1O', 'bcrypt', '2025-08-30 00:41:16', NULL, 'china', '25 Ewing', 'Perth', 'wa', '8899', '/avatar/111.jpg', '/media/profilePicture/d3bb4202-6984-48e7-8a31-a/2914cfbd8ba54dcdb7ebd6df00eb359e.png', '2025-08-30 00:41:16', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('ed5e5a1b-ca7a-4c24-8188-2', NULL, NULL, 'Zhenyi', 'suzhenyi1994@gmail.com', NULL, NULL, '$2b$12$/a.GVLKRcMILYb.lI4agieUoSXxOc0YMTaSmqRaqJQ4JjtO1cAsGC', 'bcrypt', '2025-09-10 13:37:25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 13:37:25', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('f258cd66-e81d-4620-9655-5', 'Hiro', 'Tanaka', 'Hiro Tanaka', 'hiro@example.com', '+61 422 123 789', '1993-06-22', '$2b$12$2goaU/Ymid3hX.0ja5dH.ezozpyKCGK3hAYnWyTEMEq.dvohEeuzW', 'bcrypt', '2025-09-11 13:13:59', NULL, 'Australia', '88 Rundle Mall', 'Adelaide', 'SA', '5000', '', '', '2025-09-11 13:13:59', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('f261c2c6-4853-47b3-9e5c-3', 'Veronica', 'Lyu', 'Veronica Lyu', 'lyuzhulin@gmail.com', '0491170217', '1999-11-07', '$2b$12$ibp9qsAEfF9eyjpRpTDXSe.ISiHCJEMpXMEk35R3xsEQ/7UjZOiTi', 'bcrypt', '2025-08-28 13:09:16', NULL, 'AU', '11', 'Perth', 'WA', '6000', 'https://ui-avatars.com/api/?name=v&background=f97316&color=fff', NULL, '2025-08-28 13:09:16', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('fa55f849-c36f-49c6-96ff-d', NULL, NULL, 'christ', 'christ@example.com', NULL, NULL, '$2b$12$IDOUa.E18GwBBBPPZvtFhuETZhdu9OLi1lyVELT7rBbRo/ysXCw4K', 'bcrypt', '2025-08-27 14:57:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-27 14:57:42', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('fc635042-01ae-46b5-947c-1', 'Simon', 'Lyu', 'Simon Lyu', 'nomapsimon@gmail.com', '0491170217', NULL, '$2b$12$uFhDM2yycQy4XmqwzOHvOeQpAFvNsVRmljjpqi40mMR8KMw/aHBh2', 'bcrypt', '2025-09-05 07:56:55', NULL, 'AU', '162 Brisbane St', 'Perth', 'WA', '6000', 'https://ui-avatars.com/api/?name=simon&background=f97316&color=fff', NULL, '2025-09-05 07:56:55', NULL, NULL, 0, 0);
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `name`, `email`, `phone_number`, `date_of_birth`, `password_hash`, `password_algo`, `password_set_at`, `location`, `country`, `street_address`, `city`, `state`, `zip_code`, `avatar`, `profile_picture`, `created_at`, `remember_token`, `last_login_at`, `terms_accepted`, `is_admin`) VALUES ('user-uuid-1234', NULL, NULL, 'Test User', 'test@example.com', NULL, NULL, '$2b$12$examplehashedpassword', 'bcrypt', '2025-08-23 08:14:33', 'Sample Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-23 08:14:33', NULL, NULL, 1, 0);
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

-- ----------------------------
-- Table structure for bans
-- ----------------------------
DROP TABLE IF EXISTS `bans`;
CREATE TABLE `bans` (
  `ban_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `banned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `banned_by` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ban_id`),
  KEY `fk_ban_user` (`user_id`),
  KEY `fk_ban_admin` (`banned_by`),
  CONSTRAINT `fk_ban_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ban_admin` FOREIGN KEY (`banned_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of bans
-- ----------------------------
BEGIN;
COMMIT;
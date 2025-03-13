-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 12, 2025 at 10:24 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chat_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender` int(11) NOT NULL,
  `recipient` int(11) NOT NULL,
  `message` text NOT NULL,
  `timestamp` datetime NOT NULL,
  `is_read` tinyint(4) DEFAULT 0,
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender`, `recipient`, `message`, `timestamp`, `is_read`, `read_at`) VALUES
(1, 1, 2, 'sdsd', '2025-03-11 08:50:29', 1, '2025-03-12 07:20:17'),
(2, 1, 2, 'ryryryry', '2025-03-11 08:50:48', 1, '2025-03-12 07:20:17'),
(3, 1, 2, 'send message offline', '2025-03-11 08:59:39', 1, '2025-03-12 07:20:17'),
(4, 1, 2, 'test again', '2025-03-11 09:00:00', 1, '2025-03-12 07:20:17'),
(5, 2, 1, 'hi po mr Ralph', '2025-03-12 07:20:39', 1, '2025-03-12 07:20:39'),
(6, 1, 2, 'oh hello Admin', '2025-03-12 07:20:56', 1, '2025-03-12 07:20:56'),
(7, 2, 1, 'its working now', '2025-03-12 07:31:21', 1, '2025-03-12 07:31:21'),
(8, 2, 1, 'hhdfd', '2025-03-12 07:36:08', 1, '2025-03-12 07:36:17'),
(9, 1, 2, 'sdsd', '2025-03-12 07:36:12', 1, '2025-03-12 07:36:20'),
(10, 2, 1, 'xcvcv', '2025-03-12 07:45:57', 1, '2025-03-12 07:45:57'),
(11, 2, 1, 'cvcvcv', '2025-03-12 07:46:06', 1, '2025-03-12 07:46:06'),
(12, 2, 1, 'cfg', '2025-03-12 07:46:17', 1, '2025-03-12 07:46:17'),
(13, 2, 1, 'sdsd', '2025-03-12 07:46:24', 1, '2025-03-12 07:46:24'),
(14, 2, 1, 'sdsdsd', '2025-03-12 07:49:18', 1, '2025-03-12 07:49:18'),
(15, 2, 1, 'sdsd', '2025-03-12 07:49:24', 1, '2025-03-12 07:49:24'),
(16, 1, 2, 'sdfdsfdsff', '2025-03-12 07:49:29', 1, '2025-03-12 07:49:31'),
(17, 1, 2, 'sdfsdf', '2025-03-12 07:49:36', 1, '2025-03-12 07:49:36'),
(18, 1, 2, 'gfhgfhfg', '2025-03-12 07:49:49', 1, '2025-03-12 07:49:49'),
(19, 1, 2, 'asdda', '2025-03-12 07:51:21', 1, '2025-03-12 07:51:30'),
(20, 1, 2, 'trtrr', '2025-03-12 07:51:25', 1, '2025-03-12 07:51:30'),
(21, 2, 1, 'hi', '2025-03-12 07:51:56', 1, '2025-03-12 07:52:34'),
(22, 2, 1, 'sdsd', '2025-03-12 07:54:17', 1, '2025-03-12 07:54:17'),
(23, 1, 2, 'ssdsd', '2025-03-12 07:55:39', 1, '2025-03-12 07:55:39'),
(24, 1, 2, 'sdsd', '2025-03-12 07:57:04', 1, '2025-03-12 07:57:10'),
(25, 2, 1, 'sd', '2025-03-12 08:53:59', 1, '2025-03-12 08:53:59'),
(26, 1, 2, 'ssd', '2025-03-12 08:54:27', 1, '2025-03-12 08:57:12'),
(27, 2, 1, 'fgfgfg', '2025-03-12 09:06:54', 1, '2025-03-12 09:06:54'),
(28, 2, 1, 'eer', '2025-03-12 09:07:17', 1, '2025-03-12 09:07:17'),
(29, 1, 2, 'dfgdfg', '2025-03-12 09:07:34', 1, '2025-03-12 09:07:34'),
(30, 1, 2, 'ddfgdfgd', '2025-03-12 09:07:51', 1, '2025-03-12 09:08:01'),
(31, 1, 2, 'fghghgh', '2025-03-12 09:07:58', 1, '2025-03-12 09:08:01');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` int(11) NOT NULL,
  `roleId` int(11) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `role` enum('rider','client') NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `roleId`, `firstName`, `lastName`, `role`, `created_at`) VALUES
(1, 1, 'Admin', 'client', 'client', '2025-03-11 08:40:56'),
(2, 1, 'RALPH', 'JEROTA', 'rider', '2025-03-11 08:40:56');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sender` (`sender`),
  ADD KEY `idx_recipient` (`recipient`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`recipient`) REFERENCES `users` (`userId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

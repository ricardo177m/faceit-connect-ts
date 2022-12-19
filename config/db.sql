CREATE TABLE IF NOT EXISTS `link` (
  `uuid` varchar(28) NOT NULL,
  `faceit_id` varchar(36) DEFAULT NULL,
  `nickname` varchar(64) DEFAULT NULL,
  `token` varchar(8),
  `linked_at` timestamp DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE IF NOT EXISTS `channel` (
  `channel_id` int NOT NULL,
  `lobby_id` varchar(36) NOT NULL
  `created_by_bot` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

ALTER TABLE `link`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `token` (`token`);
COMMIT;

ALTER TABLE `channel`
  ADD PRIMARY KEY (`lobby_id`),
  ADD UNIQUE KEY `channel_id` (`channel_id`);
COMMIT;

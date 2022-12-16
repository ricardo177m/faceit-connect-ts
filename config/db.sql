CREATE TABLE `link` (
  `uuid` varchar(28) NOT NULL,
  `faceit_id` varchar(36) DEFAULT NULL,
  `nickname` varchar(64) DEFAULT NULL,
  `token` varchar(8),
  `linked_at` timestamp DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

ALTER TABLE `link`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `token` (`token`);
COMMIT;

CREATE TABLE `vault_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL DEFAULT 0,
	`s3Key` text NOT NULL,
	`s3Url` text NOT NULL,
	`folder` varchar(64) NOT NULL DEFAULT 'general',
	`parsedText` text,
	`parsedMeta` json,
	`aiSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vault_files_id` PRIMARY KEY(`id`)
);

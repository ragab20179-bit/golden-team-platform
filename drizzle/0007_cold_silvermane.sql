CREATE TABLE `neo_ai_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module` varchar(64) NOT NULL,
	`engine` enum('gpt','manus','hybrid') NOT NULL,
	`modelName` varchar(64) NOT NULL DEFAULT 'unknown',
	`promptTokens` int NOT NULL DEFAULT 0,
	`completionTokens` int NOT NULL DEFAULT 0,
	`totalTokens` int NOT NULL DEFAULT 0,
	`estimatedCostUsd` varchar(16) NOT NULL DEFAULT '0.000000',
	`queryPreview` varchar(200),
	`userId` int,
	`userName` varchar(128),
	`latencyMs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `neo_ai_usage_id` PRIMARY KEY(`id`)
);

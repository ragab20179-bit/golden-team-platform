CREATE TABLE `odoo_ai_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`userEmail` varchar(320),
	`userPrompt` text NOT NULL,
	`operation` varchar(64) NOT NULL,
	`odooModel` varchar(128),
	`odooRecordId` int,
	`odooRecordName` varchar(255),
	`status` enum('success','failed','pending','rejected') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`parsedPayload` json,
	`odooResponse` json,
	`source` enum('builtin','neo_bridge') NOT NULL DEFAULT 'builtin',
	`executionMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `odoo_ai_entries_id` PRIMARY KEY(`id`)
);

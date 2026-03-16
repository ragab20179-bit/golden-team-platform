CREATE TABLE `neo_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('direct','group','ai') NOT NULL DEFAULT 'ai',
	`createdBy` int NOT NULL,
	`lastEngine` enum('manus','gpt','hybrid') DEFAULT 'manus',
	`participantIds` json,
	`lastMessageAt` timestamp DEFAULT (now()),
	`lastMessagePreview` varchar(256),
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `neo_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `neo_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderType` enum('user','ai','system') NOT NULL DEFAULT 'user',
	`senderUserId` int,
	`body` text NOT NULL,
	`engine` enum('manus','gpt','hybrid'),
	`routingScore` json,
	`contextUsed` json,
	`attachments` json,
	`isRead` boolean NOT NULL DEFAULT false,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `neo_messages_id` PRIMARY KEY(`id`)
);

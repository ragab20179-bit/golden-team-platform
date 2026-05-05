CREATE TABLE `module_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleKey` varchar(64) NOT NULL,
	`granted` boolean NOT NULL DEFAULT true,
	`grantedBy` int,
	`notes` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `module_access_id` PRIMARY KEY(`id`)
);

CREATE TABLE `astra_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionId` varchar(64) NOT NULL,
	`requestId` varchar(64) NOT NULL,
	`actorId` varchar(128) NOT NULL,
	`actorRole` varchar(64) NOT NULL,
	`domain` varchar(64) NOT NULL,
	`action` varchar(128) NOT NULL,
	`outcome` enum('ALLOW','DENY','ESCALATE','DEGRADE') NOT NULL,
	`reasonCode` varchar(128) NOT NULL,
	`policyPackVersion` varchar(32) NOT NULL,
	`latencyMs` int NOT NULL DEFAULT 0,
	`contextSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `astra_decisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `astra_decisions_decisionId_unique` UNIQUE(`decisionId`)
);
--> statement-breakpoint
CREATE TABLE `astra_policy_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(64) NOT NULL,
	`action` varchar(128) NOT NULL,
	`role` varchar(64) NOT NULL,
	`allowed` boolean NOT NULL DEFAULT true,
	`requireConsent` boolean NOT NULL DEFAULT false,
	`requireJustification` boolean NOT NULL DEFAULT false,
	`maxAmountSar` bigint,
	`notes` text,
	`createdBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `astra_policy_rules_id` PRIMARY KEY(`id`)
);

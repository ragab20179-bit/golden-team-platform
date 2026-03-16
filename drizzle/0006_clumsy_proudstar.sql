CREATE TABLE `approval_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`stepId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`actorName` varchar(128),
	`actorRole` varchar(64),
	`action` enum('approve','reject','comment','escalate','cancel') NOT NULL,
	`comment` text,
	`astraDecisionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`stepOrder` int NOT NULL DEFAULT 1,
	`approverRole` varchar(64) NOT NULL,
	`approverUserId` int,
	`approverName` varchar(128),
	`status` enum('pending','approved','rejected','skipped') NOT NULL DEFAULT 'pending',
	`isCurrent` boolean NOT NULL DEFAULT false,
	`slaHours` int NOT NULL DEFAULT 48,
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestNumber` varchar(32) NOT NULL,
	`type` enum('leave','purchase','contract','travel','expense','it_access','hr_change','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`requestedBy` int NOT NULL,
	`requestedByName` varchar(128),
	`requestedByDept` varchar(64),
	`amountSar` bigint,
	`currency` varchar(8) DEFAULT 'SAR',
	`status` enum('draft','pending','in_review','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`astraOutcome` enum('ALLOW','DENY','ESCALATE','DEGRADE'),
	`astraReasonCode` varchar(128),
	`astraDecisionId` varchar(64),
	`currentStep` int NOT NULL DEFAULT 0,
	`totalSteps` int NOT NULL DEFAULT 1,
	`payload` json,
	`attachedFileIds` json,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`dueDate` varchar(32),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `requests_requestNumber_unique` UNIQUE(`requestNumber`)
);

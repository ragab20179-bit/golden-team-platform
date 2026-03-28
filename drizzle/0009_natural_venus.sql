CREATE TABLE `bid_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`nameAr` varchar(128),
	`description` text,
	`criterionType` enum('price','linear','threshold','direct','formula') NOT NULL DEFAULT 'linear',
	`weight` int NOT NULL,
	`higherIsBetter` boolean NOT NULL DEFAULT true,
	`minValue` bigint,
	`maxValue` bigint,
	`formula` text,
	`thresholds` json,
	`inputScale` int DEFAULT 100,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bid_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bid_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bidId` int NOT NULL,
	`criterionId` int NOT NULL,
	`rawValue` bigint,
	`computedScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bid_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bid_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`vendorName` varchar(128) NOT NULL,
	`vendorNameAr` varchar(128),
	`vendorEmail` varchar(320),
	`vendorPhone` varchar(32),
	`totalBidAmount` bigint,
	`currency` varchar(8) NOT NULL DEFAULT 'SAR',
	`deliveryDays` int,
	`warrantyMonths` int,
	`notes` text,
	`notesAr` text,
	`status` enum('submitted','under_review','shortlisted','rejected','awarded') NOT NULL DEFAULT 'submitted',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bid_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`rankedResults` json,
	`engineVersion` varchar(32) NOT NULL DEFAULT '1.0',
	`evaluatedBy` int,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `evaluation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfq_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`itemName` varchar(256) NOT NULL,
	`itemNameAr` varchar(256),
	`description` text,
	`quantity` int NOT NULL DEFAULT 1,
	`unit` varchar(32) NOT NULL DEFAULT 'unit',
	`estimatedUnitPrice` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rfq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqNumber` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`titleAr` varchar(256),
	`description` text,
	`descriptionAr` text,
	`category` varchar(64),
	`budget` bigint,
	`currency` varchar(8) NOT NULL DEFAULT 'SAR',
	`submissionDeadline` varchar(32),
	`evaluationDeadline` varchar(32),
	`status` enum('draft','published','evaluation','awarded','closed','cancelled') NOT NULL DEFAULT 'draft',
	`awardedVendor` varchar(128),
	`awardedAmount` bigint,
	`awardJustification` text,
	`astraDecisionId` varchar(64),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfqs_id` PRIMARY KEY(`id`),
	CONSTRAINT `rfqs_rfqNumber_unique` UNIQUE(`rfqNumber`)
);

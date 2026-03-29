CREATE TABLE `bid_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`weight` int NOT NULL,
	`scoringType` varchar(30) NOT NULL DEFAULT 'linear',
	`stage` varchar(20) NOT NULL DEFAULT 'economic',
	`higherIsBetter` tinyint NOT NULL DEFAULT 1,
	`thresholdValue` int,
	`description` varchar(500),
	CONSTRAINT `bid_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bid_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`criterionId` int NOT NULL,
	`rawValue` int,
	`score` int,
	CONSTRAINT `bid_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bid_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`supplierName` varchar(300) NOT NULL,
	`supplierEmail` varchar(300),
	`totalPrice` int,
	`deliveryDays` int,
	`notes` text,
	`status` varchar(30) NOT NULL DEFAULT 'submitted',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bid_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`rankedResults` text,
	`recommendedSupplierId` int,
	`aiJustification` text,
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	`evaluatedBy` varchar(200),
	CONSTRAINT `evaluation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfq_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit` varchar(50),
	`estimatedPrice` int,
	CONSTRAINT `rfq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqNumber` varchar(50) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`status` varchar(30) NOT NULL DEFAULT 'draft',
	`deadline` timestamp,
	`createdBy` varchar(200),
	`technicalWeight` int NOT NULL DEFAULT 40,
	`economicWeight` int NOT NULL DEFAULT 60,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfqs_id` PRIMARY KEY(`id`),
	CONSTRAINT `rfqs_rfqNumber_unique` UNIQUE(`rfqNumber`)
);

CREATE TABLE `supplier_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`supplierEmail` varchar(300) NOT NULL,
	`supplierName` varchar(300) NOT NULL,
	`supplierCompany` varchar(300),
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`submittedAt` timestamp,
	`submissionId` int,
	`invitedBy` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplier_invites_token_unique` UNIQUE(`token`)
);

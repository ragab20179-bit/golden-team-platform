CREATE TABLE `scheduled_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`report_type` varchar(64) NOT NULL DEFAULT 'weekly_kpi',
	`period_start` varchar(32),
	`period_end` varchar(32),
	`metadata` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduled_reports_id` PRIMARY KEY(`id`)
);

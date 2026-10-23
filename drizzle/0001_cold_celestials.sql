CREATE TABLE `audit_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaintId` varchar(32) NOT NULL,
	`kind` varchar(64) NOT NULL,
	`reason` text NOT NULL,
	`severity` varchar(24) NOT NULL,
	`status` varchar(24) NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaint_events` (
	`sequence` int AUTO_INCREMENT NOT NULL,
	`id` varchar(40) NOT NULL,
	`complaintId` varchar(32) NOT NULL,
	`type` varchar(64) NOT NULL,
	`actor` varchar(120) NOT NULL,
	`actorRole` varchar(32) NOT NULL,
	`timestamp` timestamp NOT NULL,
	`payload` text NOT NULL,
	`prevHash` varchar(64) NOT NULL,
	`hash` varchar(64) NOT NULL,
	`visibility` varchar(24) NOT NULL DEFAULT 'public',
	CONSTRAINT `complaint_events_sequence` PRIMARY KEY(`sequence`),
	CONSTRAINT `complaint_events_id_unique` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaintId` varchar(32) NOT NULL,
	`category` varchar(80) NOT NULL,
	`departmentId` varchar(64) NOT NULL,
	`departmentName` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`status` varchar(64) NOT NULL,
	`currentAuthority` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isDemo` int NOT NULL DEFAULT 0,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`),
	CONSTRAINT `complaints_complaintId_unique` UNIQUE(`complaintId`)
);
--> statement-breakpoint
CREATE TABLE `demo_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`role` varchar(32) NOT NULL,
	`passwordHint` varchar(120) NOT NULL,
	CONSTRAINT `demo_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `demo_accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `demo_clock` (
	`id` int NOT NULL,
	`offsetSeconds` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demo_clock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaintId` varchar(32) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(80) NOT NULL,
	`storageKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legal_aid_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`location` varchar(120) NOT NULL,
	`languages` varchar(255) NOT NULL,
	`format` varchar(80) NOT NULL,
	`access` varchar(32) NOT NULL,
	`verified` int NOT NULL DEFAULT 0,
	`category` varchar(80) NOT NULL,
	CONSTRAINT `legal_aid_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(32) NOT NULL DEFAULT 'user';
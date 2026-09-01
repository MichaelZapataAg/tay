CREATE TABLE `capital_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `capital_movements_date_idx` ON `capital_movements` (`date`);--> statement-breakpoint
CREATE INDEX `capital_movements_type_idx` ON `capital_movements` (`type`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`alias` text,
	`phone` text,
	`address` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `clients_name_idx` ON `clients` (`name`);--> statement-breakpoint
CREATE INDEX `clients_active_idx` ON `clients` (`active`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expenses_date_idx` ON `expenses` (`date`);--> statement-breakpoint
CREATE TABLE `loans` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`client_name` text NOT NULL,
	`initial_amount` integer NOT NULL,
	`current_capital` integer NOT NULL,
	`interest_rate` real NOT NULL,
	`payment_frequency` text NOT NULL,
	`frequency_days` integer DEFAULT 15 NOT NULL,
	`loan_type` text DEFAULT 'solo_interes' NOT NULL,
	`start_date` text NOT NULL,
	`next_due_date` text NOT NULL,
	`status` text DEFAULT 'activo' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `loans_client_idx` ON `loans` (`client_id`);--> statement-breakpoint
CREATE INDEX `loans_status_idx` ON `loans` (`status`);--> statement-breakpoint
CREATE INDEX `loans_next_due_date_idx` ON `loans` (`next_due_date`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`client_id` text NOT NULL,
	`paid_at` text NOT NULL,
	`date` text NOT NULL,
	`period_covered` text,
	`interest_amount` integer DEFAULT 0 NOT NULL,
	`capital_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`payment_method` text DEFAULT 'efectivo' NOT NULL,
	`receipt_photo_uri` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `payments_loan_idx` ON `payments` (`loan_id`);--> statement-breakpoint
CREATE INDEX `payments_client_idx` ON `payments` (`client_id`);--> statement-breakpoint
CREATE INDEX `payments_date_idx` ON `payments` (`date`);
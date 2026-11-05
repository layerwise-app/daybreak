CREATE TABLE `app_secrets` (
	`name` text PRIMARY KEY,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`email` text NOT NULL UNIQUE,
	`devices` text NOT NULL,
	`position` integer NOT NULL,
	`owner_notified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `waitlist_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`visitor` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `waitlist_created_at_idx` ON `waitlist` (`created_at`);--> statement-breakpoint
CREATE INDEX `waitlist_attempts_visitor_idx` ON `waitlist_attempts` (`visitor`,`created_at`);--> statement-breakpoint
CREATE INDEX `waitlist_attempts_created_at_idx` ON `waitlist_attempts` (`created_at`);
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"avatar_url" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email"))
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"code" char(3) PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"symbol" varchar,
	"minor_units" smallint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "currencies_code_format" CHECK ("currencies"."code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "currencies_minor_units_range" CHECK ("currencies"."minor_units" BETWEEN 0 AND 4)
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"timezone" varchar NOT NULL,
	"base_currency_code" char(3) NOT NULL,
	"status_override" varchar,
	"cover_url" text,
	"created_by" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_date_range" CHECK ("trips"."start_date" <= "trips"."end_date"),
	CONSTRAINT "trips_status_override_valid" CHECK ("trips"."status_override" IS NULL OR "trips"."status_override" IN ('PLANNING', 'UPCOMING', 'TRAVELING', 'COMPLETED'))
);
--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" varchar,
	"role" varchar NOT NULL,
	"status" varchar DEFAULT 'ACTIVE' NOT NULL,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_members_trip_id_user_id_key" UNIQUE("trip_id","user_id"),
	CONSTRAINT "trip_members_role_valid" CHECK ("trip_members"."role" IN ('OWNER', 'MEMBER')),
	CONSTRAINT "trip_members_status_valid" CHECK ("trip_members"."status" IN ('ACTIVE', 'LEFT', 'REMOVED')),
	CONSTRAINT "trip_members_user_or_display_name" CHECK ("trip_members"."user_id" IS NOT NULL OR "trip_members"."display_name" IS NOT NULL),
	CONSTRAINT "trip_members_owner_has_user" CHECK ("trip_members"."role" <> 'OWNER' OR "trip_members"."user_id" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_base_currency_code_currencies_code_fk" FOREIGN KEY ("base_currency_code") REFERENCES "public"."currencies"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "trips_start_date_end_date_idx" ON "trips" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "trip_members_user_id_status_idx" ON "trip_members" USING btree ("user_id","status");
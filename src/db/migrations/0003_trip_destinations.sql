CREATE TABLE "trip_destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"country_code" char(2),
	"timezone" varchar,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_destinations_trip_id_sort_order_key" UNIQUE("trip_id","sort_order"),
	CONSTRAINT "trip_destinations_sort_order_nonnegative" CHECK ("trip_destinations"."sort_order" >= 0),
	CONSTRAINT "trip_destinations_country_code_format" CHECK ("trip_destinations"."country_code" IS NULL OR "trip_destinations"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "trip_destinations_latitude_range" CHECK ("trip_destinations"."latitude" IS NULL OR "trip_destinations"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "trip_destinations_longitude_range" CHECK ("trip_destinations"."longitude" IS NULL OR "trip_destinations"."longitude" BETWEEN -180 AND 180)
);
--> statement-breakpoint
ALTER TABLE "trip_destinations" ADD CONSTRAINT "trip_destinations_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trip_destinations_trip_id_idx" ON "trip_destinations" USING btree ("trip_id");
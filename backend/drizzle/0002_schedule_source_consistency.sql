ALTER TABLE "service_schedules" ADD COLUMN "source_type" varchar(20) NOT NULL DEFAULT 'manual';--> statement-breakpoint
UPDATE "service_schedules" SET "source_type" = 'order' WHERE "order_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "service_schedules" ADD CONSTRAINT "schedules_source_type_check" CHECK ("service_schedules"."source_type" IN ('order', 'manual'));--> statement-breakpoint
ALTER TABLE "service_schedules" ADD CONSTRAINT "schedules_source_relation_check" CHECK (("service_schedules"."source_type" = 'order' AND "service_schedules"."order_id" IS NOT NULL) OR ("service_schedules"."source_type" = 'manual' AND "service_schedules"."order_id" IS NULL));--> statement-breakpoint
CREATE UNIQUE INDEX "schedules_active_order_unique" ON "service_schedules" USING btree ("order_id") WHERE "service_schedules"."deleted_at" IS NULL AND "service_schedules"."order_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "service_schedules" DROP CONSTRAINT "service_schedules_no_overlap";--> statement-breakpoint
ALTER TABLE "service_schedules" ADD CONSTRAINT "service_schedules_no_overlap" EXCLUDE USING gist (
	"worker_id" WITH =,
	tstzrange("start_time", "end_time", '[]') WITH &&
) WHERE ("deleted_at" IS NULL AND "status" NOT IN ('cancelled', 'completed'));

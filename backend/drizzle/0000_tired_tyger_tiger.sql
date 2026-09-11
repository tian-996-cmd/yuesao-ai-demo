CREATE EXTENSION IF NOT EXISTS "btree_gist";
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"service_type" varchar(60) DEFAULT '月嫂' NOT NULL,
	"address" text,
	"city" varchar(100) NOT NULL,
	"budget_min" integer DEFAULT 0 NOT NULL,
	"budget_max" integer DEFAULT 0 NOT NULL,
	"source" varchar(60) DEFAULT '线下咨询' NOT NULL,
	"status" varchar(30) DEFAULT '新客户' NOT NULL,
	"remark" text,
	"due_date" date,
	"service_days" integer DEFAULT 26 NOT NULL,
	"parity" varchar(20) DEFAULT '第一胎' NOT NULL,
	"family" text,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_count" integer DEFAULT 0 NOT NULL,
	"consultant" varchar(80) DEFAULT '未分配' NOT NULL,
	"last_follow_up" varchar(80) DEFAULT '暂无' NOT NULL,
	"follow_ups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"demand_profile" jsonb,
	"recommended_worker_ids" jsonb,
	"locked_worker_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(40) NOT NULL,
	"name" varchar(40) NOT NULL,
	"description" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"worker_id" uuid,
	"service_type" varchar(60) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "service_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"order_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" varchar(30) DEFAULT 'confirmed' NOT NULL,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "service_workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"age" integer DEFAULT 40 NOT NULL,
	"hometown" varchar(100) DEFAULT '' NOT NULL,
	"current_city" varchar(100) DEFAULT '' NOT NULL,
	"service_level" varchar(40) DEFAULT '专业' NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"service_count" integer DEFAULT 0 NOT NULL,
	"service_area" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"personality_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"special_experience_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT '空档' NOT NULL,
	"salary_standard" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3, 2) DEFAULT '5.00' NOT NULL,
	"remark" text,
	"available_from" date NOT NULL,
	"ratings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"service_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviews" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(80) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(80) NOT NULL,
	"role_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_locked_worker_id_service_workers_id_fk" FOREIGN KEY ("locked_worker_id") REFERENCES "public"."service_workers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_worker_id_service_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."service_workers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_schedules" ADD CONSTRAINT "service_schedules_worker_id_service_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."service_workers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_schedules" ADD CONSTRAINT "service_schedules_order_id_service_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_status_idx" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_slug_unique" ON "roles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "service_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_worker_idx" ON "service_orders" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "service_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "schedules_worker_time_idx" ON "service_schedules" USING btree ("worker_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "schedules_order_idx" ON "service_schedules" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "workers_status_idx" ON "service_workers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workers_name_idx" ON "service_workers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
ALTER TABLE "service_schedules" ADD CONSTRAINT "service_schedules_no_overlap" EXCLUDE USING gist (
	"worker_id" WITH =,
	tstzrange("start_time", "end_time", '[]') WITH &&
) WHERE ("deleted_at" IS NULL AND "status" <> 'cancelled');

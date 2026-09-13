ALTER TABLE "service_orders" RENAME COLUMN "price" TO "total_amount";--> statement-breakpoint
ALTER TABLE "service_orders" RENAME CONSTRAINT "orders_price_nonnegative_check" TO "orders_total_amount_nonnegative_check";--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "deposit_amount" numeric(12, 2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "final_payment_due_date" date;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "orders_deposit_amount_check" CHECK ("service_orders"."deposit_amount" >= 0 AND "service_orders"."deposit_amount" <= "service_orders"."total_amount");--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_type" varchar(20) NOT NULL,
	"payment_method" varchar(30) NOT NULL,
	"paid_at" date NOT NULL,
	"remark" text,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "payments_amount_positive_check" CHECK ("payments"."amount" > 0),
	CONSTRAINT "payments_type_check" CHECK ("payments"."payment_type" IN ('deposit', 'final', 'partial', 'other', 'refund')),
	CONSTRAINT "payments_method_check" CHECK ("payments"."payment_method" IN ('cash', 'wechat', 'alipay', 'bank_transfer', 'other'))
);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_service_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");

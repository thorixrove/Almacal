CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'very', 'extra');--> statement-breakpoint
CREATE TYPE "public"."diet_preference" AS ENUM('classic', 'keto', 'vegan', 'vegetarian');--> statement-breakpoint
CREATE TYPE "public"."goal" AS ENUM('lose', 'maintain', 'gain');--> statement-breakpoint
CREATE TYPE "public"."meal_status" AS ENUM('analyzing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."unit_preference" AS ENUM('metric', 'imperial');--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"imageUrl" text NOT NULL,
	"status" "meal_status" DEFAULT 'analyzing' NOT NULL,
	"name" text,
	"calories" integer,
	"proteinG" integer,
	"carbsG" integer,
	"fatG" integer,
	"errorReason" text,
	"triggerRunId" text,
	"loggedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerkUserId" text NOT NULL,
	"email" text,
	"timezone" text,
	"unitPreference" "unit_preference",
	"gender" text,
	"dateOfBirth" date,
	"heightCm" numeric,
	"weightKg" numeric,
	"goal" "goal",
	"targetWeightKg" numeric,
	"activityLevel" "activity_level",
	"paceKgPerWeek" numeric,
	"dietPreference" "diet_preference",
	"dailyCalories" integer,
	"proteinG" integer,
	"carbsG" integer,
	"fatG" integer,
	"planRationale" text,
	"planGeneratedAt" timestamp with time zone,
	"onboardingCompletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerkUserId_unique" UNIQUE("clerkUserId")
);
--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meals_user_logged_at_idx" ON "meals" USING btree ("userId","loggedAt" DESC NULLS LAST);
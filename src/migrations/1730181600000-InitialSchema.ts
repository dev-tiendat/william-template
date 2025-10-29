import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1730181600000 implements MigrationInterface {
  name = 'InitialSchema1730181600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM('ACTIVE', 'INACTIVE');
    `)
    await queryRunner.query(`
      CREATE TYPE "gender_type_enum" AS ENUM('MALE', 'FEMALE', 'OTHER');
    `)
    await queryRunner.query(`
      CREATE TYPE "experience_level_enum" AS ENUM('BEGINNER', 'INTERMEDIATE', 'PRO');
    `)
    await queryRunner.query(`
      CREATE TYPE "training_goals_enum" AS ENUM('MAINTAIN', 'IMPROVE', 'PEAK');
    `)
    await queryRunner.query(`
      CREATE TYPE "sport_type_enum" AS ENUM(
        'BOXING', 'MMA', 'MUAY_THAI', 'KICKBOXING', 'BRAZILIAN_JIU_JITSU',
        'TAEKWONDO', 'JUDO', 'KARATE', 'WRESTLING', 'SAMBO', 'OTHER'
      );
    `)

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "psalt" VARCHAR(32) NOT NULL,
        "firebase_uid" VARCHAR(255) UNIQUE,
        "status" "user_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "full_name" VARCHAR(100),
        "date_of_birth" DATE,
        "gender" "gender_type_enum",
        "height" INTEGER,
        "weight" DECIMAL(5,2),
        "weight_class" DECIMAL(5,2),
        "sport_type" "sport_type_enum"[],
        "training_goals" "training_goals_enum",
        "experience_level" "experience_level_enum",
        "avatar_url" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email");`)
    await queryRunner.query(`CREATE INDEX "idx_users_firebase_uid" ON "users" ("firebase_uid");`)
    await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users" ("status");`)

    // Create sys_role table
    await queryRunner.query(`
      CREATE TABLE "sys_role" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(50) NOT NULL UNIQUE,
        "value" VARCHAR NOT NULL UNIQUE,
        "remark" VARCHAR,
        "status" SMALLINT DEFAULT 1,
        "default" BOOLEAN,
        "create_by" INTEGER,
        "update_by" INTEGER,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    // Create sys_user_roles junction table
    await queryRunner.query(`
      CREATE TABLE "sys_user_roles" (
        "user_id" INTEGER NOT NULL,
        "role_id" INTEGER NOT NULL,
        CONSTRAINT "PK_sys_user_roles" PRIMARY KEY ("user_id", "role_id")
      );
    `)
    await queryRunner.query(`CREATE INDEX "IDX_sys_user_roles_user" ON "sys_user_roles" ("user_id");`)
    await queryRunner.query(`CREATE INDEX "IDX_sys_user_roles_role" ON "sys_user_roles" ("role_id");`)
    await queryRunner.query(`
      ALTER TABLE "sys_user_roles"
      ADD CONSTRAINT "FK_sys_user_roles_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `)
    await queryRunner.query(`
      ALTER TABLE "sys_user_roles"
      ADD CONSTRAINT "FK_sys_user_roles_role"
      FOREIGN KEY ("role_id") REFERENCES "sys_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `)

    // Create sys_menu table
    await queryRunner.query(`
      CREATE TABLE "sys_menu" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "path" VARCHAR,
        "permission" VARCHAR,
        "status" SMALLINT DEFAULT 1,
        "create_by" INTEGER,
        "update_by" INTEGER,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    // Create sys_role_menus junction table
    await queryRunner.query(`
      CREATE TABLE "sys_role_menus" (
        "role_id" INTEGER NOT NULL,
        "menu_id" INTEGER NOT NULL,
        CONSTRAINT "PK_sys_role_menus" PRIMARY KEY ("role_id", "menu_id")
      );
    `)
    await queryRunner.query(`CREATE INDEX "IDX_sys_role_menus_role" ON "sys_role_menus" ("role_id");`)
    await queryRunner.query(`CREATE INDEX "IDX_sys_role_menus_menu" ON "sys_role_menus" ("menu_id");`)
    await queryRunner.query(`
      ALTER TABLE "sys_role_menus"
      ADD CONSTRAINT "FK_sys_role_menus_role"
      FOREIGN KEY ("role_id") REFERENCES "sys_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `)
    await queryRunner.query(`
      ALTER TABLE "sys_role_menus"
      ADD CONSTRAINT "FK_sys_role_menus_menu"
      FOREIGN KEY ("menu_id") REFERENCES "sys_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `)

    // Create user_access_tokens table
    await queryRunner.query(`
      CREATE TABLE "user_access_tokens" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "value" VARCHAR(500) NOT NULL,
        "expired_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" INTEGER
      );
    `)
    await queryRunner.query(`
      ALTER TABLE "user_access_tokens"
      ADD CONSTRAINT "FK_user_access_tokens_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `)

    // Create user_refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE "user_refresh_tokens" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "value" VARCHAR(500) NOT NULL,
        "expired_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "accessTokenId" UUID
      );
    `)
    await queryRunner.query(`CREATE UNIQUE INDEX "REL_user_refresh_tokens_access" ON "user_refresh_tokens" ("accessTokenId");`)
    await queryRunner.query(`
      ALTER TABLE "user_refresh_tokens"
      ADD CONSTRAINT "FK_user_refresh_tokens_access"
      FOREIGN KEY ("accessTokenId") REFERENCES "user_access_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `)

    // Create sys_user_oauth_providers table
    await queryRunner.query(`
      CREATE TABLE "sys_user_oauth_providers" (
        "id" SERIAL PRIMARY KEY,
        "provider" VARCHAR(50) NOT NULL,
        "provider_user_id" VARCHAR NOT NULL,
        "access_token" TEXT,
        "refresh_token" TEXT,
        "token_expires_at" TIMESTAMP,
        "provider_email" VARCHAR,
        "provider_name" VARCHAR,
        "provider_avatar" VARCHAR,
        "user_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)
    await queryRunner.query(`
      ALTER TABLE "sys_user_oauth_providers"
      ADD CONSTRAINT "FK_sys_user_oauth_providers_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `)

    // Create sys_password_reset_otp table
    await queryRunner.query(`
      CREATE TABLE "sys_password_reset_otp" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL,
        "otp" VARCHAR(5) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_used" BOOLEAN NOT NULL DEFAULT false,
        "used_at" TIMESTAMP,
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)
    await queryRunner.query(`CREATE INDEX "IDX_sys_password_reset_otp_email" ON "sys_password_reset_otp" ("email");`)
    await queryRunner.query(`CREATE INDEX "IDX_sys_password_reset_otp_email_otp" ON "sys_password_reset_otp" ("email", "otp");`)

    // Create sys_task table
    await queryRunner.query(`
      CREATE TABLE "sys_task" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(50) NOT NULL UNIQUE,
        "service" VARCHAR NOT NULL,
        "type" SMALLINT DEFAULT 0,
        "status" SMALLINT DEFAULT 1,
        "start_time" TIMESTAMP,
        "end_time" TIMESTAMP,
        "limit" INTEGER DEFAULT 0,
        "cron" VARCHAR,
        "every" INTEGER,
        "data" TEXT,
        "job_opts" TEXT,
        "remark" VARCHAR,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    // Create sys_task_log table
    await queryRunner.query(`
      CREATE TABLE "sys_task_log" (
        "id" SERIAL PRIMARY KEY,
        "status" SMALLINT DEFAULT 0,
        "detail" TEXT,
        "consume_time" INTEGER DEFAULT 0,
        "task_id" INTEGER,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)
    await queryRunner.query(`
      ALTER TABLE "sys_task_log"
      ADD CONSTRAINT "FK_sys_task_log_task"
      FOREIGN KEY ("task_id") REFERENCES "sys_task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    `)

    // Create sys_login_log table
    await queryRunner.query(`
      CREATE TABLE "sys_login_log" (
        "id" SERIAL PRIMARY KEY,
        "ip" VARCHAR,
        "address" VARCHAR,
        "provider" VARCHAR,
        "ua" VARCHAR(500),
        "user_id" INTEGER,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)
    await queryRunner.query(`
      ALTER TABLE "sys_login_log"
      ADD CONSTRAINT "FK_sys_login_log_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `)

    // Create sys_captcha_log table
    await queryRunner.query(`
      CREATE TABLE "sys_captcha_log" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER,
        "account" VARCHAR,
        "code" VARCHAR,
        "provider" VARCHAR,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    // Insert default data
    await queryRunner.query(`
      INSERT INTO "sys_role" ("name", "value", "remark", "status", "default")
      VALUES
        ('Admin', 'admin', 'Administrator role with full access', 1, false),
        ('User', 'user', 'Default user role', 1, true);
    `)

    // Insert default admin user (email: admin@example.com, password: Admin123)
    await queryRunner.query(`
      INSERT INTO "users" ("email", "password", "psalt", "status")
      VALUES
        ('admin@example.com', 'cdd3370df38d4856327b5abd0a0f569e', 'adminsalt123', 'ACTIVE');
    `)

    // Assign admin role to admin user
    await queryRunner.query(`
      INSERT INTO "sys_user_roles" ("user_id", "role_id")
      SELECT u.id, r.id
      FROM "users" u, "sys_role" r
      WHERE u.email = 'admin@example.com' AND r.value = 'admin';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_captcha_log" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_login_log" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_task_log" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_task" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_password_reset_otp" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_user_oauth_providers" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_refresh_tokens" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_access_tokens" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_role_menus" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_menu" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_user_roles" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "sys_role" CASCADE;`)
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`)

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS "sport_type_enum";`)
    await queryRunner.query(`DROP TYPE IF EXISTS "training_goals_enum";`)
    await queryRunner.query(`DROP TYPE IF EXISTS "experience_level_enum";`)
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_type_enum";`)
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum";`)
  }
}

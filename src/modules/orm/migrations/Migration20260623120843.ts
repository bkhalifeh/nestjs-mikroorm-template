import { Migration } from '@mikro-orm/migrations';

export class Migration20260623120843 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "file" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "key" varchar(1024) not null, "original_name" varchar(255) not null, "mime_type" varchar(255) not null, "size" bigint not null, "status" text not null default 'pending', "uploaded_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "file" add constraint "file_key_unique" unique ("key");`,
    );
    this.addSql(`create index "file_status_index" on "file" ("status");`);

    this.addSql(
      `create table "user" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) null, "email_verified_at" timestamptz null, "phone_number" varchar(32) null, "phone_verified_at" timestamptz null, "username" varchar(64) null, "password_hash" varchar(512) null, "password_updated_at" timestamptz null, "first_name" varchar(128) null, "last_name" varchar(128) null, "avatar_url" varchar(1024) null, "role" text not null default 'user', "status" text not null default 'pending', "last_login_at" timestamptz null, "token_version" int not null default 0, primary key ("id"));`,
    );
    this.addSql(
      `alter table "user" add constraint "user_email_unique" unique ("email");`,
    );
    this.addSql(
      `alter table "user" add constraint "user_phone_number_unique" unique ("phone_number");`,
    );
    this.addSql(
      `alter table "user" add constraint "user_username_unique" unique ("username");`,
    );
    this.addSql(`create index "user_role_index" on "user" ("role");`);
    this.addSql(`create index "user_status_index" on "user" ("status");`);

    this.addSql(
      `create table "user_identity" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "provider" text not null, "provider_user_id" varchar(255) not null, "email" varchar(255) null, "user_id" uuid not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "user_identity" add constraint "user_identity_provider_provider_user_id_unique" unique ("provider", "provider_user_id");`,
    );

    this.addSql(
      `alter table "file" add constraint "file_status_check" check ("status" in ('pending', 'uploaded'));`,
    );

    this.addSql(
      `alter table "user" add constraint "user_role_check" check ("role" in ('user', 'admin'));`,
    );
    this.addSql(
      `alter table "user" add constraint "user_status_check" check ("status" in ('active', 'pending', 'disabled', 'banned'));`,
    );

    this.addSql(
      `alter table "user_identity" add constraint "user_identity_user_id_foreign" foreign key ("user_id") references "user" ("id");`,
    );
    this.addSql(
      `alter table "user_identity" add constraint "user_identity_provider_check" check ("provider" in ('local', 'google', 'github'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "user_identity" drop constraint "user_identity_user_id_foreign";`,
    );

    this.addSql(`drop table if exists "file" cascade;`);
    this.addSql(`drop table if exists "user" cascade;`);
    this.addSql(`drop table if exists "user_identity" cascade;`);
  }
}

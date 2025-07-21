

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."prayer_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prayer_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "prayer_translations_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'zh-TW'::"text"])))
);
ALTER TABLE "public"."prayer_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prayers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_date" "date" NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."prayers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."prayer_translations"
    ADD CONSTRAINT "prayer_translations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."prayer_translations"
    ADD CONSTRAINT "prayer_translations_prayer_id_language_key" UNIQUE ("prayer_id", "language");
ALTER TABLE ONLY "public"."prayers"
    ADD CONSTRAINT "prayers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."prayers"
    ADD CONSTRAINT "prayers_week_date_key" UNIQUE ("week_date");


CREATE INDEX "idx_prayer_translations_content_search" ON "public"."prayer_translations" USING "gin" ("to_tsvector"('"english"'::"regconfig", "content"));
CREATE INDEX "idx_prayer_translations_language" ON "public"."prayer_translations" USING "btree" ("language");
CREATE INDEX "idx_prayer_translations_prayer_id" ON "public"."prayer_translations" USING "btree" ("prayer_id");
CREATE INDEX "idx_prayer_translations_title_search" ON "public"."prayer_translations" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title"));
CREATE INDEX "idx_prayers_week_date" ON "public"."prayers" USING "btree" ("week_date" DESC);


CREATE OR REPLACE TRIGGER "update_prayer_translations_updated_at" BEFORE UPDATE ON "public"."prayer_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_prayers_updated_at" BEFORE UPDATE ON "public"."prayers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


ALTER TABLE ONLY "public"."prayer_translations"
    ADD CONSTRAINT "prayer_translations_prayer_id_fkey" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE CASCADE;


CREATE POLICY "Authenticated users can create prayer translations" ON "public"."prayer_translations" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can create prayers" ON "public"."prayers" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can delete prayer translations" ON "public"."prayer_translations" FOR DELETE USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can delete prayers" ON "public"."prayers" FOR DELETE USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can update prayer translations" ON "public"."prayer_translations" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can update prayers" ON "public"."prayers" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Everyone can view prayer translations" ON "public"."prayer_translations" FOR SELECT USING (true);

CREATE POLICY "Everyone can view prayers" ON "public"."prayers" FOR SELECT USING (true);

ALTER TABLE "public"."prayer_translations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prayers" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON TABLE "public"."prayer_translations" TO "anon";
GRANT ALL ON TABLE "public"."prayer_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."prayer_translations" TO "service_role";

GRANT ALL ON TABLE "public"."prayers" TO "anon";
GRANT ALL ON TABLE "public"."prayers" TO "authenticated";
GRANT ALL ON TABLE "public"."prayers" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


RESET ALL;

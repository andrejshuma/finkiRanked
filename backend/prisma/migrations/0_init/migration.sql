-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dateCreated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "post_id" UUID DEFAULT gen_random_uuid(),
    "content" TEXT DEFAULT '',
    "author_id" UUID DEFAULT gen_random_uuid(),
    "author_name" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "to_be_reviewed" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT,
    "author_id" UUID DEFAULT gen_random_uuid(),
    "author_name" TEXT,
    "comment_count" SMALLINT DEFAULT 0,

    CONSTRAINT "to_be_reviewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT DEFAULT '',
    "author_id" UUID DEFAULT gen_random_uuid(),
    "author_name" TEXT,
    "date_created" DATE DEFAULT CURRENT_TIMESTAMP,
    "comment_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT auth.uid(),
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "solved_problems" BIGINT DEFAULT 0,
    "rank" TEXT DEFAULT 'Novice',
    "points" BIGINT DEFAULT 0,
    "postCounter" SMALLINT DEFAULT 3,
    "postCheckCounter" SMALLINT DEFAULT 0,
    "isModerator" BOOLEAN NOT NULL DEFAULT false,
    "attempts" SMALLINT DEFAULT 0,
    "solvedDailyChallenge" BOOLEAN,
    "daily_test_case_id" UUID DEFAULT gen_random_uuid(),
    "daily_points" SMALLINT DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "solving_date" DATE NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "attempted_by" SMALLINT,
    "solved_by" SMALLINT,
    "expired" BOOLEAN,
    "examples" JSONB,
    "output_type" TEXT,
    "difficulty" TEXT,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "challenge_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "input" TEXT,
    "output" TEXT,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_cache" (
    "cache_key" TEXT NOT NULL,
    "data" JSONB,
    "timestamp" BIGINT,

    CONSTRAINT "leaderboard_cache_pkey" PRIMARY KEY ("cache_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_points_idx" ON "users"("points" DESC);

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_to_be_reviewed_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "to_be_reviewed" ADD CONSTRAINT "to_be_reviewed_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;


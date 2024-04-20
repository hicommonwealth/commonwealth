'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "name" character varying(255) NOT NULL;
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "image_url" character varying(255) NOT NULL;
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "funding_token_address" character varying(255);
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "prize_percentage" double precision;
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "payout_structure" double precision[];
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "paused" boolean;

ALTER TABLE ONLY public."Contests" ALTER COLUMN "winners" TYPE JSON[] USING NULL;

ALTER TABLE ONLY public."ContestActions" ADD COLUMN "thread_id" integer; 
ALTER TABLE ONLY public."ContestActions" ADD CONSTRAINT "ContestActions_threads_fkey" 
FOREIGN KEY (thread_id) REFERENCES public."Threads"(id);

CREATE TABLE public."ContestTopics" (
  contest_address character varying(255) NOT NULL,
  topic_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL
);
ALTER TABLE ONLY public."ContestTopics" ADD CONSTRAINT "ContestTopics_pkey" PRIMARY KEY (contest_address, topic_id);
ALTER TABLE ONLY public."ContestTopics" ADD CONSTRAINT "ContestTopics_topics_fkey" 
FOREIGN KEY (topic_id) REFERENCES public."Topics"(id);
        `,
        {
          transaction: t,
        },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "name";
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "image_url";
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "funding_token_address";
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "prize_percentage";
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "payout_structure";
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "paused";

ALTER TABLE ONLY public."Contests" ALTER COLUMN "winners" TYPE TEXT[];

ALTER TABLE ONLY public."ContestActions" DROP COLUMN IF EXISTS "thread_id";
ALTER TABLE ONLY public."ContestActions" DROP CONSTRAINT IF EXISTS "ContestActions_threads_fkey";

DROP TABLE IF EXISTS public."ContestTopics";
        `,
        {
          transaction: t,
        },
      );
    });
  },
};

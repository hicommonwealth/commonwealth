'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
CREATE TABLE public."ContestManagers" (
  contest_address character varying(255) NOT NULL,
  community_id character varying(255) NOT NULL,
  "interval" integer NOT NULL,
  created_at timestamp with time zone NOT NULL
);
ALTER TABLE ONLY public."ContestManagers" ADD CONSTRAINT "ContestManagers_pkey" 
PRIMARY KEY (contest_address);
ALTER TABLE ONLY public."ContestManagers" ADD CONSTRAINT "ContestManagers_community_id_fkey" 
FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE TABLE public."Contests" (
  contest_address character varying(255) NOT NULL,
  contest_id integer NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  winners character varying(255)[]
);
ALTER TABLE ONLY public."Contests" ADD CONSTRAINT "Contests_pkey" PRIMARY KEY (contest_address, contest_id);
CREATE INDEX contests_start_time ON public."Contests" USING btree (start_time);
ALTER TABLE ONLY public."Contests" ADD CONSTRAINT "Contests_contestmanagers_fkey" 
FOREIGN KEY (contest_address) REFERENCES public."ContestManagers"(contest_address);

CREATE TYPE public."enum_ContestActions_action" AS ENUM ('added', 'upvoted');
CREATE TABLE public."ContestActions" (
  contest_address character varying(255) NOT NULL,
  contest_id integer NOT NULL,
  content_id integer NOT NULL,
  actor_address character varying(255) NOT NULL,
  action public."enum_ContestActions_action" NOT NULL,
  content_url character varying(255),
  voting_power integer NOT NULL,
  created_at timestamp with time zone NOT NULL
);
ALTER TABLE ONLY public."ContestActions" ADD CONSTRAINT "ContestActions_pkey" 
PRIMARY KEY (contest_address, contest_id, content_id, actor_address, action);
ALTER TABLE ONLY public."ContestActions" ADD CONSTRAINT "ContestActions_contests_fkey" 
FOREIGN KEY (contest_address, contest_id) REFERENCES public."Contests"(contest_address, contest_id);
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
ALTER TABLE ONLY public."ContestActions" DROP CONSTRAINT "ContestActions_contests_fkey";
ALTER TABLE ONLY public."ContestActions" DROP CONSTRAINT "ContestActions_pkey";
DROP TABLE IF EXISTS public."ContestActions";
DROP TYPE IF EXISTS public."enum_ContestActions_action CASCADE";
ALTER TABLE ONLY public."Contests" DROP CONSTRAINT "Contests_contestmanagers_fkey";
DROP INDEX IF EXISTS contests_start_time;
ALTER TABLE ONLY public."Contests" DROP CONSTRAINT "Contests_pkey";
DROP TABLE IF EXISTS public."Contests";
ALTER TABLE ONLY public."ContestManagers" DROP CONSTRAINT "ContestManagers_community_id_fkey";
ALTER TABLE ONLY public."ContestManagers" DROP CONSTRAINT "ContestManagers_pkey";
DROP TABLE IF EXISTS public."ContestManagers";
        `,
        {
          transaction: t,
        },
      );
    });
  },
};

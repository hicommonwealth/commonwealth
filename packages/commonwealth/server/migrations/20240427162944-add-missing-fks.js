'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
-- Create dummy 'commonwealth-orphans' community        
insert into public."Communities"(id,name,default_symbol,active,network,type,collapsed_on_homepage,base)
select 
  'commonwealth-orphans', 'Commonwealth Orphan Entities', 'COMMON_ORPHAN', false,
  'edgeware',	'offchain',	false, ''
where not exists(select id from public."Communities" where id='commonwealth-orphans');

-- Link orphan topics to dummy 'commonwealth-orphans' community        
update public."Topics" set community_id = 'commonwealth-orphans'
where community_id not in (select id from public."Communities");

ALTER TABLE ONLY public."Topics"
ADD CONSTRAINT "Topics_community_id_fkey"
FOREIGN KEY (community_id) REFERENCES public."Communities"(id)
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."Template"
ADD CONSTRAINT "Template_contractabi_id_fkey"
FOREIGN KEY (abi_id) REFERENCES public."ContractAbis"(id)
ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE ONLY public."Template"
ADD CONSTRAINT "Template_community_id_fkey"
FOREIGN KEY (created_for_community) REFERENCES public."Communities"(id)
ON UPDATE NO ACTION ON DELETE NO ACTION;

-- Delete deleted orphan threads
DELETE FROM "Threads" AS TH
USING "Topics" AS T WHERE TH.TOPIC_ID = T.ID
AND TH.DELETED_AT IS NOT NULL
AND T.ID IS NULL;

-- Link orphan threads to first topic of community
UPDATE "Threads" AS TH
SET TOPIC_ID=T.TOPIC_ID
FROM (
    SELECT TH.ID, TH.COMMUNITY_ID,
        (SELECT ID FROM "Topics" WHERE COMMUNITY_ID = TH.COMMUNITY_ID ORDER BY ID LIMIT 1) AS TOPIC_ID
    FROM "Threads" TH LEFT JOIN "Topics" T ON TH.TOPIC_ID = T.ID
    WHERE TH.DELETED_AT IS NULL AND T.ID IS NULL
) AS T
WHERE TH.ID=T.ID;

ALTER TABLE ONLY public."Threads"
ADD CONSTRAINT "Threads_topic_id_fkey"
FOREIGN KEY (topic_id) REFERENCES public."Topics"(id)
ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public."Profiles"
ADD CONSTRAINT "Profiles_user_id_fkey"
FOREIGN KEY (user_id) REFERENCES public."Users"(id)
ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE ONLY public."CommunitySnapshotSpaces"
ADD CONSTRAINT "CommunitySnapshotSpaces_community_id_fkey"
FOREIGN KEY (community_id) REFERENCES public."Communities"(id)
ON UPDATE CASCADE ON DELETE NO ACTION;


-- Link orphan community snapshot spaces to dummy 'commonwealth-orphans' community        
update public."CommunitySnapshotSpaces" set community_id = 'commonwealth-orphans'
where community_id not in (select id from public."Communities");

ALTER TABLE ONLY public."CommunitySnapshotSpaces"
ADD CONSTRAINT "CommunitySnapshotSpaces_snapshotspace_id_fkey"
FOREIGN KEY (snapshot_space_id) REFERENCES public."SnapshotSpaces"(snapshot_space)
ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE ONLY public."SnapshotProposals"
ADD CONSTRAINT "SnapshotProposals_snapshotspace_id_fkey"
FOREIGN KEY (space) REFERENCES public."SnapshotSpaces"(snapshot_space)
ON UPDATE CASCADE ON DELETE NO ACTION;

-- delete orphan sso tokens
delete from public."SsoTokens" where not exists(select id from public."Addresses" where id=address_id);

ALTER TABLE ONLY public."SsoTokens"
ADD CONSTRAINT "SsoTokens_address_id_fkey"
FOREIGN KEY (address_id) REFERENCES public."Addresses"(id)
ON UPDATE CASCADE ON DELETE SET NULL;


-- delete orphan starred communities
delete from public."StarredCommunities" where not exists(select id from public."Communities" where id=community_id);
delete from public."StarredCommunities" where not exists(select id from public."Users" where id=user_id);

-- Many-to-many (X-ref) pattern with composite PK
ALTER TABLE ONLY public."StarredCommunities" DROP COLUMN IF EXISTS "id";
ALTER TABLE ONLY public."StarredCommunities"
ADD CONSTRAINT "Starredcommunities_pkey" PRIMARY KEY (community_id, user_id);

ALTER TABLE ONLY public."StarredCommunities"
ADD CONSTRAINT "Starredcommunities_community_id_fkey"
FOREIGN KEY (community_id) REFERENCES public."Communities"(id)
ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE ONLY public."StarredCommunities"
ADD CONSTRAINT "Starredcommunities_user_id_fkey"
FOREIGN KEY (user_id) REFERENCES public."Users"(id)
ON UPDATE CASCADE ON DELETE NO ACTION;
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
ALTER TABLE ONLY public."Topics" DROP CONSTRAINT IF EXISTS "Topics_community_id_fkey";
ALTER TABLE ONLY public."Template" DROP CONSTRAINT IF EXISTS "Template_contractabi_id_fkey";
ALTER TABLE ONLY public."Template" DROP CONSTRAINT IF EXISTS "Template_community_id_fkey";
ALTER TABLE ONLY public."Threads" DROP CONSTRAINT IF EXISTS "Threads_topic_id_fkey";
ALTER TABLE ONLY public."Profiles" DROP CONSTRAINT IF EXISTS "Profiles_user_id_fkey";
ALTER TABLE ONLY public."CommunitySnapshotSpaces" DROP CONSTRAINT IF EXISTS "CommunitySnapshotSpaces_community_id_fkey";
ALTER TABLE ONLY public."CommunitySnapshotSpaces"
  DROP CONSTRAINT IF EXISTS "CommunitySnapshotSpaces_snapshotspace_id_fkey"; 
ALTER TABLE ONLY public."SnapshotProposals" DROP CONSTRAINT IF EXISTS "SnapshotProposals_snapshotspace_id_fkey";
ALTER TABLE ONLY public."SsoTokens" DROP CONSTRAINT IF EXISTS "SsoTokens_address_id_fkey"; 

ALTER TABLE ONLY public."StarredCommunities" DROP CONSTRAINT "Starredcommunities_pkey";
ALTER TABLE ONLY public."StarredCommunities" DROP CONSTRAINT IF EXISTS "Starredcommunities_community_id_fkey";
ALTER TABLE ONLY public."StarredCommunities" DROP CONSTRAINT IF EXISTS "Starredcommunities_user_id_fkey";
`,
        {
          transaction: t,
        },
      );
    });
  },
};

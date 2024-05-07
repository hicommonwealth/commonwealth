'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
-- delete orphan reactions
delete from public."Reactions" where 
not exists(select address_id from public."Addresses" where id=address_id);

alter table only public."Reactions" 
add constraint "Reactions_address_id_fkey"
foreign key (address_id) references public."Addresses"(id);

-- Many-to-many (X-ref) pattern with composite PK

ALTER TABLE ONLY public."CommunityAlerts" DROP COLUMN IF EXISTS "id";
ALTER TABLE ONLY public."CommunityAlerts"
ADD CONSTRAINT "CommunityAlerts_pkey" PRIMARY KEY (user_id, community_id);

ALTER TABLE ONLY public."ThreadSubscriptions" DROP COLUMN IF EXISTS "id";
ALTER TABLE ONLY public."ThreadSubscriptions"
ADD CONSTRAINT "Threadsubscriptions_pkey" PRIMARY KEY (thread_id, user_id);

ALTER TABLE ONLY public."CommentSubscriptions" DROP COLUMN IF EXISTS "id";
ALTER TABLE ONLY public."CommentSubscriptions"
ADD CONSTRAINT "Commentsubscriptions_pkey" PRIMARY KEY (comment_id, user_id);

ALTER TABLE ONLY public."Collaborations" DROP COLUMN IF EXISTS "id";
ALTER TABLE public."Collaborations" DROP CONSTRAINT IF EXISTS "Collaborations_address_id_thread_id_key";
ALTER TABLE ONLY public."Collaborations"
ADD CONSTRAINT "Collaborations_pkey" PRIMARY KEY (address_id, thread_id);

--ALTER TABLE ONLY public."CommunityContracts" DROP COLUMN IF EXISTS "id";
--ALTER TABLE public."CommunityContracts" DROP CONSTRAINT IF EXISTS "CommunityContracts_community_id_contract_id_key";
--ALTER TABLE ONLY public."CommunityContracts"
--ADD CONSTRAINT "CommunityContracts_pkey" PRIMARY KEY (community_id, contract_id);

ALTER TABLE ONLY public."Memberships" DROP COLUMN IF EXISTS "id";
ALTER TABLE public."Memberships" DROP CONSTRAINT IF EXISTS "memberships_address_id_group_id";
ALTER TABLE ONLY public."Memberships"
ADD CONSTRAINT "Memberships_pkey" PRIMARY KEY (address_id, group_id);
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
ALTER TABLE public."CommunityAlerts" DROP CONSTRAINT IF EXISTS "CommunityAlerts_pkey";

ALTER TABLE public."ThreadSubscriptions" DROP CONSTRAINT IF EXISTS "Threadsubscriptions_pkey";

ALTER TABLE public."CommentSubscriptions" DROP CONSTRAINT IF EXISTS "Commentsubscriptions_pkey";

ALTER TABLE public."Collaborations" DROP CONSTRAINT IF EXISTS "Collaborations_pkey";
ALTER TABLE ONLY public."Collaborations"
ADD CONSTRAINT "Collaborations_address_id_thread_id_key" UNIQUE KEY (address_id, thread_id);

--ALTER TABLE public."CommunityContracts" DROP CONSTRAINT IF EXISTS "CommunityContracts_pkey";
--ALTER TABLE ONLY public."CommunityContracts"
--ADD CONSTRAINT "CommunityContracts_community_id_contract_id_key" UNIQUE KEY (community_id, contract_id);

ALTER TABLE public."Memberships" DROP CONSTRAINT IF EXISTS "Memberships_pkey";
ALTER TABLE ONLY public."Memberships"
ADD CONSTRAINT "memberships_address_id_group_id" UNIQUE KEY (address_id, group_id);
`,
        {
          transaction: t,
        },
      );
    });
  },
};

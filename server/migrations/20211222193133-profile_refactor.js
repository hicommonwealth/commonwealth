'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // create a new table called Profiles
      // NB: Profiles.email is public-facing, not duplicative of Users.email 
      await queryInterface.sequelize.query(
        `
            CREATE TABLE IF NOT EXISTS "Profiles"
            (
                id 			SERIAL not null,
                user_id 		integer not null,
                created_at        	timestamp with time zone,
                updated_at        	timestamp with time zone,
                profile_name		varchar(255),
                email			varchar(255),
                website		varchar(255),
                bio			text,	
                PRIMARY KEY (id)
            );
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // adds new column to map Addresses to the new Profiles object
      await queryInterface.sequelize.query(
        `
            ALTER TABLE "Addresses"
                ADD COLUMN profile_id integer;
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );



      // creates a new Profile object for each User
      await queryInterface.sequelize.query(
        `
            INSERT INTO "Profiles" (user_id, created_at, updated_at)
            SELECT u.id,
                   CURRENT_TIMESTAMP as created_at,
                   CURRENT_TIMESTAMP as updated_at
            FROM "Users" u;
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );
      
      // creates a new Profile object for each User
      await queryInterface.sequelize.query(
        `
            UPDATE "Addresses" a
            SET profile_id = p.id
            FROM "Profiles" p where a.user_id = p.user_id;
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );      

    });
  },
  
  

  down: async (queryInterface, Sequelize) => {
    // test to see if explicit rollback is required
  },
};

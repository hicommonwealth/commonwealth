'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
      // create a new table called Profiles
      // NB: Profiles.email is public-facing, not duplicative of Users.email 
     return queryInterface.createTable('Profiles', {
      id: { type: Sequelize.INTEGER, autoIncrement:true, allowNull: false, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
      profile_name: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      website: { type: Sequelize.STRING, allowNull: true },
      bio: { type: Sequelize.STRING, allowNull: true },
    });
    
      // adds new column to map Addresses to the new Profiles object
      return queryInterface.addColumn(
      		'Addresses',
      		'profile_id',
      		  {
      			type: Sequelize.INTEGER
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
    return queryInterface.dropTable('Profiles');
    return queryInterface.removeColumn('Addresses','profile_id');
  },
};

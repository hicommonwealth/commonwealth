'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
      SELECT * INTO "backup_OffchainComments" FROM "OffchainComments" 
    `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.addColumn('OffchainComments', 'thread_id', {
        type: Sequelize.INTEGER,
      });
      await queryInterface.removeConstraint('OffchainThreads','OffchainThreads_author_id_fkey');
      await queryInterface.changeColumn('OffchainThreads', 'address_id', {
        allowNull: true,
      });
      await queryInterface.addColumn('OffchainThreads', 'tmp_chain_entity_id', {
        type: Sequelize.INTEGER,
      });
      await queryInterface.sequelize.query(`
        INSERT INTO "OffchainThreads" (title, created_at, updated_at, chain, tmp_chain_entity_id)
        SELECT DISTINCT '-' as title, 
          COALESCE(ce.created_at, MIN(c.created_at) OVER (PARTITION BY c.root_id)) as created_at,
          COALESCE(ce.created_at, MIN(c.created_at) OVER (PARTITION BY c.root_id)) as updated_at,
        FROM "OffchainComments" c
          LEFT OUTER JOIN "ChainEntities" ce on c.chain = ce."chain"  
          and SPLIT_PART(c.root_id,'_',2) = ce."type_id"
          and ce."type" = case SPLIT_PART(c.root_id,'_',1)  
                    when 'compoundproposal' then 'proposal'
                    when 'cosmosproposal' then 'proposal'
                    when 'councilmotion' then 'collective-proposal'
                    when 'democracyproposal' then 'democracy-proposal'
                    when 'onchainproposal' then 'proposal'
                    when 'referendum' then 'democracy-referendum'
                    when 'signalingproposal' then 'signaling-proposal'
                    when 'sputnikproposal' then 'proposal'
                    when 'treasuryproposal' then 'treasuryproposal'		
                  end
          where c.root_id not like 'discussion%' 
        ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        UPDATE "OffchainComments" 
        SET thread_id =  SPLIT_PART(root_id,'_',2)
        WHERE root_id LIKE 'discussion%' ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.removeColumn('OffchainComments','root_id');
      await queryInterface.removeColumn('OffchainThreads','tmp_chain_entity_id');
      //TODO: map onchain threads that are valid but don't have ChainEntities ()
      //TODO: delete comments w/no threads-- deleted proposals, too old, councilcandidate, etc
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainComments','thread_id');
      await queryInterface.addColumn('OffchainComments', 'root_id', {
        type: Sequelize.VARCHAR(255),
      });
      await queryInterface.sequelize.query(`
        UPDATE "OffchainComments" 
        SET root_id =  "backup_OffchainComments".root_id
        FROM "backup_OffchainComments"
        WHERE "Comments".id = "backup_OffchainComments".id;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.dropTable('backup_OffchainComments');

    });
  }
};

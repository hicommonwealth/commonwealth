'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        SELECT * INTO "backup_OffchainComments" FROM "OffchainComments"; 
      `, {transaction: t, raw: true, type: 'RAW'},{ transaction: t });
      await queryInterface.addColumn('OffchainComments', 'thread_id', {
        type: Sequelize.INTEGER,
      },{ transaction: t });
      await queryInterface.sequelize.query(`
        ALTER TABLE "OffchainThreads" 
        DROP CONSTRAINT OffchainThreads_author_id_fkey;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.changeColumn('OffchainThreads', 'address_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      },{ transaction: t });
      await queryInterface.addColumn('OffchainThreads', 'tmp_chain_entity_id', {
        type: Sequelize.INTEGER,
      },{ transaction: t });
      await queryInterface.sequelize.query(`
        INSERT INTO "OffchainThreads" (title, created_at, updated_at, chain, tmp_chain_entity_id)
        SELECT DISTINCT '-' as title, 
          COALESCE(ce.created_at, MIN(c.created_at) OVER (PARTITION BY c.root_id)) as created_at,
          COALESCE(ce.created_at, MIN(c.created_at) OVER (PARTITION BY c.root_id)) as updated_at,
          c.chain,
          ce.id
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
        UPDATE "ChainEntities" 
        SET thread_id =  t.id
        FROM "OffchainThreads" t
        WHERE "ChainEntities".thread_id IS NULL
          AND "ChainEntities".id = t.tmp_chain_entity_id ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        UPDATE "OffchainComments" 
        SET thread_id =  SPLIT_PART(root_id,'_',2)::INTEGER
        WHERE root_id LIKE 'discussion%' ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        UPDATE "OffchainComments" 
        SET thread_id =  ce.thread_id
        FROM "ChainEntities" ce 
        WHERE "OffchainComments".root_id NOT LIKE 'discussion%' 
          AND "OffchainComments" .chain = ce."chain"  
          and SPLIT_PART("OffchainComments" .root_id,'_',2) = ce."type_id"
          and ce."type" = case SPLIT_PART("OffchainComments".root_id,'_',1)  
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
        ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.removeColumn('OffchainComments','root_id',{ transaction: t });
      await queryInterface.removeColumn('OffchainThreads','tmp_chain_entity_id',{ transaction: t });

      //TODO: map onchain threads that are valid but don't have ChainEntities ()
      //TODO: delete comments w/no threads-- deleted proposals, too old, councilcandidate, etc
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        UPDATE "ChainEntities" 
        SET thread_id =  NULL
        FROM "OffchainThreads"
        WHERE "ChainEntities".id = t.tmp_chain_entity_id ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        DELETE FROM "OffchainThreads" 
        WHERE tmp_chain_entity_id IS NOT NULL;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        ALTER TABLE "OffchainThreads" 
        ADD CONSTRAINT OffchainThreads_author_id_fkey FOREIGN KEY (address_id) REFERENCES "Addresses" (id);
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.changeColumn('OffchainThreads', 'address_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      },{ transaction: t });
      await queryInterface.removeColumn('OffchainThreads','tmp_chain_entity_id',{ transaction: t });
      await queryInterface.removeColumn('OffchainComments','thread_id',{ transaction: t });
      await queryInterface.addColumn('OffchainComments', 'root_id', {
        type: Sequelize.VARCHAR(255),
      },{ transaction: t });
      await queryInterface.sequelize.query(`
        UPDATE "OffchainComments" 
        SET root_id =  "backup_OffchainComments".root_id
        FROM "backup_OffchainComments"
        WHERE "Comments".id = "backup_OffchainComments".id;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.dropTable('backup_OffchainComments',{ transaction: t });

    });
  }
};

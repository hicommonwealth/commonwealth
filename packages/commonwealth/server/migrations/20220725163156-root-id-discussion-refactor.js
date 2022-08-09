'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        SELECT * INTO "rootIdRefactor_Comments" FROM "Comments"; 
      `, {transaction: t, raw: true, type: 'RAW'},{ transaction: t });
      await queryInterface.sequelize.query(`
        SELECT * INTO "rootIdRefactor_Reactions" FROM "Reactions"; 
      `, {transaction: t, raw: true, type: 'RAW'},{ transaction: t });
      await queryInterface.sequelize.query(`
        SELECT * INTO "rootIdRefactor_ChainEntities" FROM "ChainEntities"; 
      `, {transaction: t, raw: true, type: 'RAW'},{ transaction: t });
      await queryInterface.addColumn('Comments', 'thread_id', {
        type: Sequelize.INTEGER,
      },{ transaction: t });
      await queryInterface.sequelize.query(`
        ALTER TABLE "Threads" 
        DROP CONSTRAINT "OffchainThreads_author_id_fkey";
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.changeColumn('Threads', 'address_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      },{ transaction: t });
      await queryInterface.addColumn('Threads', 'chain_entity_id', {
        type: Sequelize.INTEGER,
      },{ transaction: t });
      await queryInterface.addColumn('Threads', 'onchain_identification', {
        type: Sequelize.STRING,
      },{ transaction: t });
      await queryInterface.sequelize.query(`
        UPDATE "Threads" 
        SET chain_entity_id =  ce.id
        FROM "ChainEntities" ce
        WHERE "Threads".id = ce.thread_id;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        INSERT INTO "Threads" (title, created_at, updated_at, chain, chain_entity_id)
        SELECT DISTINCT '-' as title, 
          COALESCE(ce.created_at, MIN(c.created_at) OVER (PARTITION BY c.root_id)) as created_at,
          COALESCE(ce.created_at, MIN(c.created_at) OVER (PARTITION BY c.root_id)) as updated_at,
          c.chain,
          ce.id
        FROM "Comments" c
          INNER JOIN "ChainEntities" ce ON c.chain = ce."chain"  
          AND SPLIT_PART(c.root_id,'_',2) = ce."type_id"
          AND ce."type" = case SPLIT_PART(c.root_id,'_',1)  
                    WHEN 'compoundproposal' then 'proposal'
                    WHEN 'cosmosproposal' then 'proposal'
                    WHEN 'councilmotion' then 'collective-proposal'
                    WHEN 'democracyproposal' then 'democracy-proposal'
                    WHEN 'onchainproposal' then 'proposal'
                    WHEN 'referendum' then 'democracy-referendum'
                    WHEN 'signalingproposal' then 'signaling-proposal'
                    WHEN 'sputnikproposal' then 'proposal'
                    WHEN 'treasuryproposal' then 'treasury-proposal'		
                  END
          WHERE c.root_id not like 'discussion%' 
        ;
      `, {transaction: t, raw: true, type: 'RAW'});
 
      await queryInterface.sequelize.query(`
      INSERT INTO "Threads" (title, created_at, updated_at, chain, chain_entity_id)
      SELECT DISTINCT '-' as title, 
        COALESCE(ce.created_at, MIN(r.created_at) OVER (PARTITION BY r.proposal_id)) as created_at,
        COALESCE(ce.created_at, MIN(r.created_at) OVER (PARTITION BY r.proposal_id)) as updated_at,
        r.chain,
        ce.id
      FROM "Reactions" r
        INNER JOIN "ChainEntities" ce ON r.chain = ce."chain"  
        AND SPLIT_PART(r.proposal_id,'_',2) = ce."type_id"
        AND ce."type" = case SPLIT_PART(r.proposal_id,'_',1)  
                  WHEN 'compoundproposal' then 'proposal'
                  WHEN 'cosmosproposal' then 'proposal'
                  WHEN 'councilmotion' then 'collective-proposal'
                  WHEN 'democracyproposal' then 'democracy-proposal'
                  WHEN 'onchainproposal' then 'proposal'
                  WHEN 'referendum' then 'democracy-referendum'
                  WHEN 'signalingproposal' then 'signaling-proposal'
                  WHEN 'sputnikproposal' then 'proposal'
                  WHEN 'treasuryproposal' then 'treasury-proposal'		
                END
        WHERE r.proposal_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "Threads" t WHERE t.chain_entity_id = ce.id)
      ;
    `, {transaction: t, raw: true, type: 'RAW'});  
    await queryInterface.sequelize.query(`
      INSERT INTO "Threads" (title, created_at, updated_at, chain, onchain_identification)
      SELECT DISTINCT '-' as title, 
        MIN(c.created_at) OVER (PARTITION BY c.root_id) as created_at,
        MIN(c.created_at) OVER (PARTITION BY c.root_id) as updated_at,
        c.chain,
        c.root_id
      FROM "Comments" c
        LEFT JOIN "ChainEntities" ce ON c.chain = ce."chain"  
        AND SPLIT_PART(c.root_id,'_',2) = ce."type_id"
        AND ce."type" = case SPLIT_PART(c.root_id,'_',1)  
                  WHEN 'compoundproposal' then 'proposal'
                  WHEN 'cosmosproposal' then 'proposal'
                  WHEN 'councilmotion' then 'collective-proposal'
                  WHEN 'democracyproposal' then 'democracy-proposal'
                  WHEN 'onchainproposal' then 'proposal'
                  WHEN 'referendum' then 'democracy-referendum'
                  WHEN 'signalingproposal' then 'signaling-proposal'
                  WHEN 'sputnikproposal' then 'proposal'
                  WHEN 'treasuryproposal' then 'treasury-proposal'		
                END
        WHERE c.root_id NOT LIKE 'discussion%' 
          AND ce.id IS NULL
      ;       
    `, {transaction: t, raw: true, type: 'RAW'});  
      await queryInterface.sequelize.query(`
        UPDATE "Comments" 
        SET thread_id =  SPLIT_PART(root_id,'_',2)::INTEGER
        WHERE root_id LIKE 'discussion%' ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        UPDATE "Comments" 
        SET thread_id =  t.id
        FROM "ChainEntities" ce 
        INNER JOIN "Threads" t ON t.chain_entity_id = ce.id
        WHERE "Comments".root_id NOT LIKE 'discussion%' 
          AND "Comments".chain = ce."chain"  
          AND SPLIT_PART("Comments".root_id,'_',2) = ce."type_id"
          AND ce."type" = case SPLIT_PART("Comments".root_id,'_',1)  
                    WHEN 'compoundproposal' then 'proposal'
                    WHEN 'cosmosproposal' then 'proposal'
                    WHEN 'councilmotion' then 'collective-proposal'
                    WHEN 'democracyproposal' then 'democracy-proposal'
                    WHEN 'onchainproposal' then 'proposal'
                    WHEN 'referendum' then 'democracy-referendum'
                    WHEN 'signalingproposal' then 'signaling-proposal'
                    WHEN 'sputnikproposal' then 'proposal'
                    WHEN 'treasuryproposal' then 'treasury-proposal'		
                  END
        ;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
      UPDATE "Reactions" 
      SET thread_id =  t.id
      FROM "ChainEntities" ce 
      INNER JOIN "Threads" t ON t.chain_entity_id = ce.id
      WHERE "Reactions".chain = ce."chain"  
        AND SPLIT_PART("Reactions".proposal_id,'_',2) = ce."type_id"
        AND ce."type" = case SPLIT_PART("Reactions".proposal_id,'_',1)  
                  WHEN 'compoundproposal' then 'proposal'
                  WHEN 'cosmosproposal' then 'proposal'
                  WHEN 'councilmotion' then 'collective-proposal'
                  WHEN 'democracyproposal' then 'democracy-proposal'
                  WHEN 'onchainproposal' then 'proposal'
                  WHEN 'referendum' then 'democracy-referendum'
                  WHEN 'signalingproposal' then 'signaling-proposal'
                  WHEN 'sputnikproposal' then 'proposal'
                  WHEN 'treasuryproposal' then 'treasury-proposal'		
                END
      ;
    `, {transaction: t, raw: true, type: 'RAW'});     
    //*******commented only for testing, so new objects can be compared to old state in situ
      //await queryInterface.removeColumn('Comments','root_id',{ transaction: t });
      //await queryInterface.removeColumn('Reactions','proposal_id',{ transaction: t });
      //await queryInterface.removeColumn('ChainEntities','thread_id',{ transaction: t });

    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Threads','chain_entity_id',{ transaction: t });
      await queryInterface.removeColumn('Threads','onchain_identification',{ transaction: t });
      await queryInterface.removeColumn('Comments','thread_id',{ transaction: t });
    //*******commented only for testing, so new objects can be compared to old state in situ
      // await queryInterface.addColumn('Comments', 'root_id', {
      //   type: Sequelize.VARCHAR(255),
      // },{ transaction: t });
      // await queryInterface.addColumn('Reactions', 'proposal_id', {
      //   type: Sequelize.VARCHAR(255),
      // },{ transaction: t });
      // await queryInterface.addColumn('ChainEntities', 'thread_id', {
      //   type: Sequelize.INTEGER,
      // },{ transaction: t });
      await queryInterface.sequelize.query(`
        UPDATE "Comments" 
        SET root_id =  "rootIdRefactor_Comments".root_id
        FROM "rootIdRefactor_Comments"
        WHERE "Comments".id = "rootIdRefactor_Comments".id;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        UPDATE "Reactions" 
        SET proposal_id =  "rootIdRefactor_Reactions".proposal_id,
            thread_id = NULL
        FROM "rootIdRefactor_Reactions"
        WHERE "Reactions".id = "rootIdRefactor_Reactions".id;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        UPDATE "ChainEntities" 
        SET thread_id =  "rootIdRefactor_ChainEntities".thread_id
        FROM "rootIdRefactor_ChainEntities"
        WHERE "ChainEntities".id = "rootIdRefactor_ChainEntities".id;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        DELETE FROM "Threads" 
        WHERE address_id IS NULL;
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.sequelize.query(`
        ALTER TABLE "Threads" 
        ADD CONSTRAINT "OffchainThreads_author_id_fkey" FOREIGN KEY (address_id) REFERENCES "Addresses" (id);
      `, {transaction: t, raw: true, type: 'RAW'});
      await queryInterface.changeColumn('Threads', 'address_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      },{ transaction: t });
      await queryInterface.dropTable('rootIdRefactor_Comments',{ transaction: t });
      await queryInterface.dropTable('rootIdRefactor_Reactions',{ transaction: t });
      await queryInterface.dropTable('rootIdRefactor_ChainEntities',{ transaction: t });

    });
  }
};

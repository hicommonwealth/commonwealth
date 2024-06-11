'use strict';

const { QueryTypes } = require('sequelize');
const { hasher } = require('node-object-hash');

const hashInstance = hasher({
  coerce: true,
  sort: true,
  trim: true,
  alg: 'sha256',
  enc: 'hex',
});

async function getChainNodes(queryInterface, transaction) {
  console.log('Fetching existing ChainNodes');
  const ethereumResult = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE "ChainNodes".name = 'Ethereum (Mainnet)'
        LIMIT 1;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT }
  );

  const mumbaiResult = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE "ChainNodes".name = 'Polygon (Mumbai)'
        LIMIT 1;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT }
  );

  const celoResult = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE "ChainNodes".name = 'Celo'
        LIMIT 1;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT }
  );

  console.log('Existing ChainNodes fetched');
  return [ethereumResult, mumbaiResult, celoResult];
}

async function findOrCreateAbi(queryInterface, transaction, rawAbi, nickname) {
  console.log(`Uploading ABI: ${nickname}`);
  let abi = await queryInterface.sequelize.query(
    `
    SELECT id FROM "ContractAbis"
    WHERE abi_hash = ?;
  `,
    {
      transaction,
      type: QueryTypes.SELECT,
      replacements: [hashInstance.hash(rawAbi)],
    }
  );

  if (abi.length > 0) {
    return abi[0].id;
  }

  const result = await queryInterface.sequelize.query(
    `
        INSERT INTO "ContractAbis" (abi, verified, created_at, updated_at, nickname, abi_hash)
        VALUES (
            ?,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            ?,
            ?
        ) RETURNING id;
      `,
    {
      transaction,
      raw: true,
      type: QueryTypes.INSERT,
      replacements: [
        JSON.stringify(rawAbi),
        nickname,
        hashInstance.hash(rawAbi),
      ],
    }
  );

  return result[0][0].id;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // raw query since `queryInterface.createTable` uniqueKeys option lacks documentation
      // uses SERIAL rather than GENERATED ALWAYS AS IDENTITY to ensure Sequelize compatibility
      console.log('Creating new tables');
      await queryInterface.sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS "EvmEventSources" (
          id SERIAL PRIMARY KEY,
          chain_node_id INTEGER NOT NULL REFERENCES "ChainNodes"(id),
          contract_address VARCHAR(255) NOT NULL,
          event_signature VARCHAR(255) NOT NULL,
          kind VARCHAR(255) NOT NULL,
          CONSTRAINT unique_event_source UNIQUE(chain_node_id, contract_address, event_signature)
        );
      `,
        { transaction }
      );

      await queryInterface.createTable(
        'LastProcessedEvmBlocks',
        {
          chain_node_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            references: { model: 'ChainNodes', key: 'id' },
          },
          block_number: { type: Sequelize.INTEGER, allowNull: false },
        },
        { transaction }
      );
      console.log('New tables created');

      const [ethereumResult, mumbaiResult, celoResult] = await getChainNodes(
        queryInterface,
        transaction
      );

      console.log('Finding or creating ABIs');
      const aaveAbiId = await findOrCreateAbi(
        queryInterface,
        transaction,
        rawAaveAbi,
        'AaveGovernanceV2'
      );
      const dydxAbiId = await findOrCreateAbi(
        queryInterface,
        transaction,
        rawDydxAbi,
        'DydxGovernor'
      );
      const tribeAbiId = await findOrCreateAbi(
        queryInterface,
        transaction,
        rawTribeAbi,
        'FeiDAO'
      );
      const autonomiesAbiId = await findOrCreateAbi(
        queryInterface,
        transaction,
        rawAutonomiesAbi,
        'NVMGovernance'
      );
      const impactMarketAbiId = await findOrCreateAbi(
        queryInterface,
        transaction,
        rawImpactMarketAbi,
        'PACTDelegator'
      );
      const moolaMarketAbiId = await findOrCreateAbi(
        queryInterface,
        transaction,
        rawMoolaMarketAbi,
        'MoolaGovernorBravoDelegator'
      );
      console.log('ABI processing complete');

      let eventSourceRecords = [];

      const aaveAddress = '0xEC568fffba86c094cf06b22134B23074DFE2252c';
      const dydxAddress = '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2';
      const tribeAddress = '0x0BEF27FEB58e857046d630B2c03dFb7bae567494';

      if (ethereumResult.length > 0) {
        const ethereumId = ethereumResult[0].id;

        await queryInterface.sequelize.query(
          `
        UPDATE "Contracts"
        SET abi_id = CASE
                         WHEN address = ? AND chain_node_id = ? THEN ?
                         WHEN address = ? AND chain_node_id = ? THEN ?
                         WHEN address = ? AND chain_node_id = ? THEN ?
            END
        WHERE (address, chain_node_id) IN (?);
      `,
          {
            transaction,
            type: QueryTypes.UPDATE,
            replacements: [
              aaveAddress,
              ethereumId,
              aaveAbiId,
              dydxAddress,
              ethereumId,
              dydxAbiId,
              tribeAddress,
              ethereumId,
              tribeAbiId,
              [
                [aaveAddress, ethereumId],
                [dydxAddress, ethereumId],
                [tribeAddress, ethereumId],
              ],
            ],
          }
        );
        console.log('Ethereum ABIs uploaded');

        eventSourceRecords = [
          ...eventSourceRecords,
          // Aave on mainnet
          {
            chain_node_id: ethereumId,
            contract_address: aaveAddress,
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: ethereumId,
            contract_address: aaveAddress,
            event_signature:
              '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec',
            kind: 'proposal-created',
          },
          {
            chain_node_id: ethereumId,
            contract_address: aaveAddress,
            event_signature:
              '0x9c85b616f29fca57a17eafe71cf9ff82ffef41766e2cf01ea7f8f7878dd3ec24',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: ethereumId,
            contract_address: aaveAddress,
            event_signature:
              '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe',
            kind: 'proposal-queued',
          },

          // dYdX (aave base) on mainnet
          {
            chain_node_id: ethereumId,
            contract_address: dydxAddress,
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: ethereumId,
            contract_address: dydxAddress,
            event_signature:
              '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec',
            kind: 'proposal-created',
          },
          {
            chain_node_id: ethereumId,
            contract_address: dydxAddress,
            event_signature:
              '0x9c85b616f29fca57a17eafe71cf9ff82ffef41766e2cf01ea7f8f7878dd3ec24',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: ethereumId,
            contract_address: dydxAddress,
            event_signature:
              '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe',
            kind: 'proposal-queued',
          },

          // tribe (compound base) on Ethereum mainnet
          {
            chain_node_id: ethereumId,
            contract_address: tribeAddress,
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: ethereumId,
            contract_address: tribeAddress,
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: ethereumId,
            contract_address: tribeAddress,
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: ethereumId,
            contract_address: tribeAddress,
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },
        ];
      }

      const autonomiesAddress = '0xac4610582926DcF22bf327AbB6F6aC82BD49FE0f';
      if (mumbaiResult.length > 0) {
        const mumbaiId = mumbaiResult[0].id;

        await queryInterface.sequelize.query(
          `
            UPDATE "Contracts"
            SET abi_id = ?
            WHERE (address, chain_node_id) = (?, ?);
          `,
          {
            transaction,
            type: QueryTypes.UPDATE,
            replacements: [autonomiesAbiId, autonomiesAddress, mumbaiId],
          }
        );

        eventSourceRecords = [
          ...eventSourceRecords,

          // autonomies-testnet-dao (semi-compound-bravo) on polygon-mumbai
          {
            chain_node_id: mumbaiId,
            contract_address: autonomiesAddress,
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: mumbaiId,
            contract_address: autonomiesAddress,
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: mumbaiId,
            contract_address: autonomiesAddress,
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: mumbaiId,
            contract_address: autonomiesAddress,
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },
        ];
      }

      const impactMarketAddress = '0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4';
      const moolaMarketAddress = '0xde457ed1A713C290C4f8dE1dE0D0308Fc7722937';
      if (celoResult.length > 0) {
        const celoId = celoResult[0].id;

        await queryInterface.sequelize.query(
          `
        UPDATE "Contracts"
        SET abi_id = CASE
                         WHEN address = ? AND chain_node_id = ? THEN ?
                         WHEN address = ? AND chain_node_id = ? THEN ?
            END
        WHERE (address, chain_node_id) IN (?);
      `,
          {
            transaction,
            type: QueryTypes.UPDATE,
            replacements: [
              impactMarketAddress,
              celoId,
              impactMarketAbiId,
              moolaMarketAddress,
              celoId,
              moolaMarketAbiId,
              [
                [impactMarketAddress, celoId],
                [moolaMarketAddress, celoId],
              ],
            ],
          }
        );
        console.log('Uploaded Celo ABIs');

        eventSourceRecords = [
          ...eventSourceRecords,

          // impact market (compound-bravo ish base) on celo
          {
            chain_node_id: celoId,
            contract_address: impactMarketAddress,
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: celoId,
            contract_address: impactMarketAddress,
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: celoId,
            contract_address: impactMarketAddress,
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: celoId,
            contract_address: impactMarketAddress,
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },

          // moola-market (compound-bravo ish base) on celo
          {
            chain_node_id: celoId,
            contract_address: moolaMarketAddress,
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: celoId,
            contract_address: moolaMarketAddress,
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: celoId,
            contract_address: moolaMarketAddress,
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: celoId,
            contract_address: moolaMarketAddress,
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },
        ];
      }

      if (eventSourceRecords.length !== 0) {
        console.log('Inserting event sources');
        await queryInterface.bulkInsert('EvmEventSources', eventSourceRecords, {
          transaction,
        });
        console.log('Event sources inserted');
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('EvmEventSources', { transaction });
      await queryInterface.dropTable('LastProcessedEvmBlock', { transaction });
      await queryInterface.bulkDelete(
        'ContractAbis',
        {
          nickname: [
            'AaveGovernanceV2',
            'DydxGovernor',
            'FeiDAO',
            'NVMGovernance',
            'PACTDelegator',
            'MoolaGovernorBravoDelegator',
          ],
        },
        { transaction }
      );
    });
  },
};

const rawAaveAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'guardian',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorAuthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorUnauthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newStrategy',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'GovernanceStrategyChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'strategy',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorExecution',
        type: 'address',
      },
    ],
    name: 'ProposalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'executionTime',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorQueueing',
        type: 'address',
      },
    ],
    name: 'ProposalQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'support',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
    ],
    name: 'VoteEmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'VotingDelayChanged',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'NAME',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'VOTE_EMITTED_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: '__abdicate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'authorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
    ],
    name: 'create',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGovernanceStrategy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGuardian',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalById',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'creator',
            type: 'address',
          },
          {
            internalType: 'contract IExecutorWithTimelock',
            name: 'executor',
            type: 'address',
          },
          {
            internalType: 'address[]',
            name: 'targets',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'values',
            type: 'uint256[]',
          },
          {
            internalType: 'string[]',
            name: 'signatures',
            type: 'string[]',
          },
          {
            internalType: 'bytes[]',
            name: 'calldatas',
            type: 'bytes[]',
          },
          {
            internalType: 'bool[]',
            name: 'withDelegatecalls',
            type: 'bool[]',
          },
          {
            internalType: 'uint256',
            name: 'startBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'endBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'executionTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'forVotes',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'againstVotes',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'executed',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'canceled',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'strategy',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'ipfsHash',
            type: 'bytes32',
          },
        ],
        internalType: 'struct IAaveGovernanceV2.ProposalWithoutVotes',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalState',
    outputs: [
      {
        internalType: 'enum IAaveGovernanceV2.ProposalState',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProposalsCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'getVoteOnProposal',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'support',
            type: 'bool',
          },
          {
            internalType: 'uint248',
            name: 'votingPower',
            type: 'uint248',
          },
        ],
        internalType: 'struct IAaveGovernanceV2.Vote',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVotingDelay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'isExecutorAuthorized',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
    ],
    name: 'setGovernanceStrategy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
    ],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
    ],
    name: 'submitVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'submitVoteBySignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'unauthorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
const rawDydxAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'addExecutorAdmin',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorAuthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorUnauthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newStrategy',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'GovernanceStrategyChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'strategy',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorExecution',
        type: 'address',
      },
    ],
    name: 'ProposalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'executionTime',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorQueueing',
        type: 'address',
      },
    ],
    name: 'ProposalQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'support',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
    ],
    name: 'VoteEmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'VotingDelayChanged',
    type: 'event',
  },
  {
    inputs: [],
    name: 'ADD_EXECUTOR_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DOMAIN_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'EIP712_DOMAIN_NAME',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'OWNER_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'VOTE_EMITTED_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'authorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
    ],
    name: 'create',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGovernanceStrategy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalById',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'creator',
            type: 'address',
          },
          {
            internalType: 'contract IExecutorWithTimelock',
            name: 'executor',
            type: 'address',
          },
          {
            internalType: 'address[]',
            name: 'targets',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'values',
            type: 'uint256[]',
          },
          {
            internalType: 'string[]',
            name: 'signatures',
            type: 'string[]',
          },
          {
            internalType: 'bytes[]',
            name: 'calldatas',
            type: 'bytes[]',
          },
          {
            internalType: 'bool[]',
            name: 'withDelegatecalls',
            type: 'bool[]',
          },
          {
            internalType: 'uint256',
            name: 'startBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'endBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'executionTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'forVotes',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'againstVotes',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'executed',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'canceled',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'strategy',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'ipfsHash',
            type: 'bytes32',
          },
        ],
        internalType: 'struct IDydxGovernor.ProposalWithoutVotes',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalState',
    outputs: [
      {
        internalType: 'enum IDydxGovernor.ProposalState',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProposalsCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'getVoteOnProposal',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'support',
            type: 'bool',
          },
          {
            internalType: 'uint248',
            name: 'votingPower',
            type: 'uint248',
          },
        ],
        internalType: 'struct IDydxGovernor.Vote',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVotingDelay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'isExecutorAuthorized',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
    ],
    name: 'setGovernanceStrategy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
    ],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
    ],
    name: 'submitVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'submitVoteBySignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'unauthorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
const rawTribeAbi = [
  {
    inputs: [
      {
        internalType: 'contract ERC20VotesComp',
        name: 'tribe',
        type: 'address',
      },
      {
        internalType: 'contract ICompoundTimelock',
        name: 'timelock',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'guardian',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'ProposalCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'proposer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'ProposalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'eta',
        type: 'uint256',
      },
    ],
    name: 'ProposalQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldProposalThreshold',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newProposalThreshold',
        type: 'uint256',
      },
    ],
    name: 'ProposalThresholdUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldQuorum',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newQuorum',
        type: 'uint256',
      },
    ],
    name: 'QuorumUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'Rollback',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'eta',
        type: 'uint256',
      },
    ],
    name: 'RollbackQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldTimelock',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newTimelock',
        type: 'address',
      },
    ],
    name: 'TimelockChange',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'support',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
    ],
    name: 'VoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldVotingDelay',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
    ],
    name: 'VotingDelayUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldVotingPeriod',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingPeriod',
        type: 'uint256',
      },
    ],
    name: 'VotingPeriodUpdated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'BACKUP_GOVERNOR',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'BALLOT_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'COUNTING_MODE',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ROLLBACK_DEADLINE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: '__acceptAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: '__executeRollback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'eta', type: 'uint256' }],
    name: '__rollback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'uint8', name: 'support', type: 'uint8' },
    ],
    name: 'castVote',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'uint8', name: 'support', type: 'uint8' },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'castVoteBySig',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'uint8', name: 'support', type: 'uint8' },
      {
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
    ],
    name: 'castVoteWithReason',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes32',
        name: 'descriptionHash',
        type: 'bytes32',
      },
    ],
    name: 'execute',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getActions',
    outputs: [
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'getReceipt',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'hasVoted',
            type: 'bool',
          },
          {
            internalType: 'uint8',
            name: 'support',
            type: 'uint8',
          },
          {
            internalType: 'uint96',
            name: 'votes',
            type: 'uint96',
          },
        ],
        internalType: 'struct IGovernorCompatibilityBravo.Receipt',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256',
      },
    ],
    name: 'getVotes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'hasVoted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes32',
        name: 'descriptionHash',
        type: 'bytes32',
      },
    ],
    name: 'hashProposal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'proposalDeadline',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'proposalEta',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'proposalSnapshot',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'proposals',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'address',
        name: 'proposer',
        type: 'address',
      },
      { internalType: 'uint256', name: 'eta', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'forVotes',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'againstVotes',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'abstainVotes',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'canceled', type: 'bool' },
      {
        internalType: 'bool',
        name: 'executed',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'propose',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'propose',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes32',
        name: 'descriptionHash',
        type: 'bytes32',
      },
    ],
    name: 'queue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'quorum',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'quorumVotes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newProposalThreshold',
        type: 'uint256',
      },
    ],
    name: 'setProposalThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newQuorum',
        type: 'uint256',
      },
    ],
    name: 'setQuorum',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
    ],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newVotingPeriod',
        type: 'uint256',
      },
    ],
    name: 'setVotingPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'state',
    outputs: [
      {
        internalType: 'enum IGovernor.ProposalState',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'timelock',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [
      {
        internalType: 'contract ERC20VotesComp',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract ICompoundTimelock',
        name: 'newTimelock',
        type: 'address',
      },
    ],
    name: 'updateTimelock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingDelay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingPeriod',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const rawAutonomiesAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'NewAdmin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldImplementation',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'NewImplementation',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldPendingAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newPendingAdmin',
        type: 'address',
      },
    ],
    name: 'NewPendingAdmin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'proposer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'eta',
        type: 'uint256',
      },
    ],
    name: 'ProposalQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldProposalThresholdPercentage',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newProposalThresholdPercentage',
        type: 'uint256',
      },
    ],
    name: 'ProposalThresholdSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldQuorumVotesPercentage',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newQuorumVotesPercentage',
        type: 'uint256',
      },
    ],
    name: 'QuorumVotesSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'TransferERC20',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'support',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votes',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
    ],
    name: 'VoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldVotingDelay',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
    ],
    name: 'VotingDelaySet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldVotingPeriod',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingPeriod',
        type: 'uint256',
      },
    ],
    name: 'VotingPeriodSet',
    type: 'event',
  },
  {
    inputs: [],
    name: 'BALLOT_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DOMAIN_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'NAME',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PERCENTAGE_PRECISION',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PROPOSAL_MAX_OPERATIONS',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
      { internalType: 'uint8', name: '_support', type: 'uint8' },
    ],
    name: 'castVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
      { internalType: 'uint8', name: '_support', type: 'uint8' },
      {
        internalType: 'uint8',
        name: '_v',
        type: 'uint8',
      },
      { internalType: 'bytes32', name: '_r', type: 'bytes32' },
      {
        internalType: 'bytes32',
        name: '_s',
        type: 'bytes32',
      },
    ],
    name: 'castVoteBySig',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
      { internalType: 'uint8', name: '_support', type: 'uint8' },
      {
        internalType: 'string',
        name: '_reason',
        type: 'string',
      },
    ],
    name: 'castVoteWithReason',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
    ],
    name: 'getActions',
    outputs: [
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_voter',
        type: 'address',
      },
    ],
    name: 'getReceipt',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'hasVoted',
            type: 'bool',
          },
          {
            internalType: 'uint8',
            name: 'support',
            type: 'uint8',
          },
          {
            internalType: 'uint96',
            name: 'votes',
            type: 'uint96',
          },
        ],
        internalType: 'struct INVMGovernance.Receipt',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_timelock',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_releaseToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_votingPeriod',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_votingDelay',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_proposalThresholdPercentage',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_quorumVotesPercentage',
        type: 'uint256',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'latestProposalIds',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'proposalCalldatas',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'proposalReceipts',
    outputs: [
      { internalType: 'bool', name: 'hasVoted', type: 'bool' },
      {
        internalType: 'uint8',
        name: 'support',
        type: 'uint8',
      },
      { internalType: 'uint96', name: 'votes', type: 'uint96' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'proposalSignatures',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'proposalTargets',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalThresholdPercentage',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'proposalValues',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'address',
        name: 'proposer',
        type: 'address',
      },
      { internalType: 'uint256', name: 'eta', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'forVotes',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'againstVotes',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'abstainVotes',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'canceled', type: 'bool' },
      {
        internalType: 'bool',
        name: 'executed',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '_values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: '_signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: '_calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'string',
        name: '_description',
        type: 'string',
      },
    ],
    name: 'propose',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
    ],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'quorumVotes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'quorumVotesPercentage',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'releaseToken',
    outputs: [
      {
        internalType: 'contract IVotingToken',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newProposalThresholdPercentage',
        type: 'uint256',
      },
    ],
    name: 'setProposalThresholdPercentage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newQuorumVotesPercentage',
        type: 'uint256',
      },
    ],
    name: 'setQuorumVotesPercentage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newVotingDelay',
        type: 'uint256',
      },
    ],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newVotingPeriod',
        type: 'uint256',
      },
    ],
    name: 'setVotingPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256',
      },
    ],
    name: 'state',
    outputs: [
      {
        internalType: 'enum INVMGovernance.ProposalState',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'timelock',
    outputs: [
      {
        internalType: 'contract INVMTimelock',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [
      {
        internalType: 'contract IVotingToken',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingDelay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingPeriod',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const rawImpactMarketAbi = [
  {
    type: 'event',
    name: 'NewAdmin',
    inputs: [
      {
        type: 'address',
        name: 'oldAdmin',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newAdmin',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'NewImplementation',
    inputs: [
      {
        type: 'address',
        name: 'oldImplementation',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newImplementation',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'NewPendingAdmin',
    inputs: [
      {
        type: 'address',
        name: 'oldPendingAdmin',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newPendingAdmin',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        type: 'address',
        name: 'previousOwner',
        internalType: 'address',
        indexed: true,
      },
      {
        type: 'address',
        name: 'newOwner',
        internalType: 'address',
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalCanceled',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'address',
        name: 'proposer',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address[]',
        name: 'targets',
        internalType: 'address[]',
        indexed: false,
      },
      {
        type: 'uint256[]',
        name: 'values',
        internalType: 'uint256[]',
        indexed: false,
      },
      {
        type: 'string[]',
        name: 'signatures',
        internalType: 'string[]',
        indexed: false,
      },
      {
        type: 'bytes[]',
        name: 'calldatas',
        internalType: 'bytes[]',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'startBlock',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'endBlock',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'string',
        name: 'description',
        internalType: 'string',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalExecuted',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalQueued',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'eta',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalThresholdSet',
    inputs: [
      {
        type: 'uint256',
        name: 'oldProposalThreshold',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'newProposalThreshold',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'QuorumVotesSet',
    inputs: [
      {
        type: 'uint256',
        name: 'oldQuorumVotes',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'newQuorumVotes',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ReleaseTokenSet',
    inputs: [
      {
        type: 'address',
        name: 'oldReleaseToken',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newReleaseToken',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'TransferERC20',
    inputs: [
      {
        type: 'address',
        name: 'token',
        internalType: 'address',
        indexed: true,
      },
      {
        type: 'address',
        name: 'to',
        internalType: 'address',
        indexed: true,
      },
      {
        type: 'uint256',
        name: 'amount',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      {
        type: 'address',
        name: 'voter',
        internalType: 'address',
        indexed: true,
      },
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint8',
        name: 'support',
        internalType: 'uint8',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'votes',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'string',
        name: 'reason',
        internalType: 'string',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VotingDelaySet',
    inputs: [
      {
        type: 'uint256',
        name: 'oldVotingDelay',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'newVotingDelay',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VotingPeriodSet',
    inputs: [
      {
        type: 'uint256',
        name: 'oldVotingPeriod',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'newVotingPeriod',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'bytes32', name: '', internalType: 'bytes32' }],
    name: 'BALLOT_TYPEHASH',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'bytes32', name: '', internalType: 'bytes32' }],
    name: 'DOMAIN_TYPEHASH',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MAX_PROPOSAL_THRESHOLD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MAX_VOTING_DELAY',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MAX_VOTING_PERIOD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MIN_PROPOSAL_THRESHOLD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MIN_VOTING_DELAY',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MIN_VOTING_PERIOD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'string', name: '', internalType: 'string' }],
    name: 'NAME',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'PROPOSAL_MAX_OPERATIONS',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setProposalThreshold',
    inputs: [
      {
        type: 'uint256',
        name: '_newProposalThreshold',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setQuorumVotes',
    inputs: [
      {
        type: 'uint256',
        name: '_newQuorumVotes',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setReleaseToken',
    inputs: [
      {
        type: 'address',
        name: '_newReleaseToken',
        internalType: 'contract IHasVotes',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setVotingDelay',
    inputs: [
      {
        type: 'uint256',
        name: '_newVotingDelay',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setVotingPeriod',
    inputs: [
      {
        type: 'uint256',
        name: '_newVotingPeriod',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'cancel',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'castVote',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
      {
        type: 'uint8',
        name: '_support',
        internalType: 'uint8',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'castVoteBySig',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
      {
        type: 'uint8',
        name: '_support',
        internalType: 'uint8',
      },
      { type: 'uint8', name: '_v', internalType: 'uint8' },
      {
        type: 'bytes32',
        name: '_r',
        internalType: 'bytes32',
      },
      { type: 'bytes32', name: '_s', internalType: 'bytes32' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'castVoteWithReason',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
      {
        type: 'uint8',
        name: '_support',
        internalType: 'uint8',
      },
      { type: 'string', name: '_reason', internalType: 'string' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'payable',
    outputs: [],
    name: 'execute',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'address[]',
        name: 'targets',
        internalType: 'address[]',
      },
      {
        type: 'uint256[]',
        name: 'values',
        internalType: 'uint256[]',
      },
      {
        type: 'string[]',
        name: 'signatures',
        internalType: 'string[]',
      },
      {
        type: 'bytes[]',
        name: 'calldatas',
        internalType: 'bytes[]',
      },
    ],
    name: 'getActions',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint96', name: '', internalType: 'uint96' }],
    name: 'getPriorVotes',
    inputs: [
      {
        type: 'address',
        name: '_voter',
        internalType: 'address',
      },
      {
        type: 'uint256',
        name: '_beforeBlock',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'tuple',
        name: '',
        internalType: 'struct PACTDelegateStorageV1.Receipt',
        components: [
          {
            type: 'bool',
            name: 'hasVoted',
            internalType: 'bool',
          },
          {
            type: 'uint8',
            name: 'support',
            internalType: 'uint8',
          },
          {
            type: 'uint96',
            name: 'votes',
            internalType: 'uint96',
          },
        ],
      },
    ],
    name: 'getReceipt',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
      {
        type: 'address',
        name: '_voter',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'initialize',
    inputs: [
      {
        type: 'address',
        name: '_timelock',
        internalType: 'address',
      },
      {
        type: 'address',
        name: '_token',
        internalType: 'address',
      },
      {
        type: 'address',
        name: '_releaseToken',
        internalType: 'address',
      },
      {
        type: 'uint256',
        name: '_votingPeriod',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: '_votingDelay',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: '_proposalThreshold',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: '_quorumVotes',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'latestProposalIds',
    inputs: [{ type: 'address', name: '', internalType: 'address' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'address', name: '', internalType: 'address' }],
    name: 'owner',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'bytes', name: '', internalType: 'bytes' }],
    name: 'proposalCalldatas',
    inputs: [
      { type: 'uint256', name: '', internalType: 'uint256' },
      {
        type: 'uint256',
        name: '',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'proposalCount',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      { type: 'bool', name: 'hasVoted', internalType: 'bool' },
      {
        type: 'uint8',
        name: 'support',
        internalType: 'uint8',
      },
      { type: 'uint96', name: 'votes', internalType: 'uint96' },
    ],
    name: 'proposalReceipts',
    inputs: [
      { type: 'uint256', name: '', internalType: 'uint256' },
      {
        type: 'address',
        name: '',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'string', name: '', internalType: 'string' }],
    name: 'proposalSignatures',
    inputs: [
      { type: 'uint256', name: '', internalType: 'uint256' },
      {
        type: 'uint256',
        name: '',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'address', name: '', internalType: 'address' }],
    name: 'proposalTargets',
    inputs: [
      { type: 'uint256', name: '', internalType: 'uint256' },
      {
        type: 'uint256',
        name: '',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'proposalThreshold',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'proposalValues',
    inputs: [
      { type: 'uint256', name: '', internalType: 'uint256' },
      {
        type: 'uint256',
        name: '',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      { type: 'uint256', name: 'id', internalType: 'uint256' },
      {
        type: 'address',
        name: 'proposer',
        internalType: 'address',
      },
      { type: 'uint256', name: 'eta', internalType: 'uint256' },
      {
        type: 'uint256',
        name: 'startBlock',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'endBlock',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'forVotes',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'againstVotes',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'abstainVotes',
        internalType: 'uint256',
      },
      { type: 'bool', name: 'canceled', internalType: 'bool' },
      {
        type: 'bool',
        name: 'executed',
        internalType: 'bool',
      },
    ],
    name: 'proposals',
    inputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'propose',
    inputs: [
      {
        type: 'address[]',
        name: '_targets',
        internalType: 'address[]',
      },
      {
        type: 'uint256[]',
        name: '_values',
        internalType: 'uint256[]',
      },
      {
        type: 'string[]',
        name: '_signatures',
        internalType: 'string[]',
      },
      {
        type: 'bytes[]',
        name: '_calldatas',
        internalType: 'bytes[]',
      },
      {
        type: 'string',
        name: '_description',
        internalType: 'string',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'queue',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'quorumVotes',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'address',
        name: '',
        internalType: 'contract IHasVotes',
      },
    ],
    name: 'releaseToken',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'renounceOwnership',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'uint8',
        name: '',
        internalType: 'enum PACTDelegateStorageV1.ProposalState',
      },
    ],
    name: 'state',
    inputs: [
      {
        type: 'uint256',
        name: '_proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'address',
        name: '',
        internalType: 'contract TimelockInterface',
      },
    ],
    name: 'timelock',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'address',
        name: '',
        internalType: 'contract IHasVotes',
      },
    ],
    name: 'token',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'transfer',
    inputs: [
      {
        type: 'address',
        name: '_token',
        internalType: 'contract IERC20',
      },
      { type: 'address', name: '_to', internalType: 'address' },
      {
        type: 'uint256',
        name: '_amount',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'transferOwnership',
    inputs: [
      {
        type: 'address',
        name: 'newOwner',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'votingDelay',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'votingPeriod',
    inputs: [],
  },
];
const rawMoolaMarketAbi = [
  {
    type: 'event',
    name: 'NewAdmin',
    inputs: [
      {
        type: 'address',
        name: 'oldAdmin',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newAdmin',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'NewImplementation',
    inputs: [
      {
        type: 'address',
        name: 'oldImplementation',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newImplementation',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'NewPendingAdmin',
    inputs: [
      {
        type: 'address',
        name: 'oldPendingAdmin',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newPendingAdmin',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalCanceled',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'address',
        name: 'proposer',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address[]',
        name: 'targets',
        internalType: 'address[]',
        indexed: false,
      },
      {
        type: 'uint256[]',
        name: 'values',
        internalType: 'uint256[]',
        indexed: false,
      },
      {
        type: 'string[]',
        name: 'signatures',
        internalType: 'string[]',
        indexed: false,
      },
      {
        type: 'bytes[]',
        name: 'calldatas',
        internalType: 'bytes[]',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'startBlock',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'endBlock',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'string',
        name: 'description',
        internalType: 'string',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalExecuted',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalQueued',
    inputs: [
      {
        type: 'uint256',
        name: 'id',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'eta',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalThresholdSet',
    inputs: [
      {
        type: 'uint256',
        name: 'oldProposalThreshold',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'newProposalThreshold',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      {
        type: 'address',
        name: 'voter',
        internalType: 'address',
        indexed: true,
      },
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint8',
        name: 'support',
        internalType: 'uint8',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'votes',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'string',
        name: 'reason',
        internalType: 'string',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VotingDelaySet',
    inputs: [
      {
        type: 'uint256',
        name: 'oldVotingDelay',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'newVotingDelay',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VotingPeriodSet',
    inputs: [
      {
        type: 'uint256',
        name: 'oldVotingPeriod',
        internalType: 'uint256',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'newVotingPeriod',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'WhitelistAccountExpirationSet',
    inputs: [
      {
        type: 'address',
        name: 'account',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'expiration',
        internalType: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'WhitelistGuardianSet',
    inputs: [
      {
        type: 'address',
        name: 'oldGuardian',
        internalType: 'address',
        indexed: false,
      },
      {
        type: 'address',
        name: 'newGuardian',
        internalType: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'bytes32', name: '', internalType: 'bytes32' }],
    name: 'BALLOT_TYPEHASH',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'bytes32', name: '', internalType: 'bytes32' }],
    name: 'DOMAIN_TYPEHASH',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MAX_PROPOSAL_THRESHOLD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MAX_VOTING_DELAY',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MAX_VOTING_PERIOD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MIN_PROPOSAL_THRESHOLD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MIN_VOTING_DELAY',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'MIN_VOTING_PERIOD',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_acceptAdmin',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_initiate',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setPendingAdmin',
    inputs: [
      {
        type: 'address',
        name: 'newPendingAdmin',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setProposalThreshold',
    inputs: [
      {
        type: 'uint256',
        name: 'newProposalThreshold',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setVotingDelay',
    inputs: [
      {
        type: 'uint256',
        name: 'newVotingDelay',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setVotingPeriod',
    inputs: [
      {
        type: 'uint256',
        name: 'newVotingPeriod',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setWhitelistAccountExpiration',
    inputs: [
      {
        type: 'address',
        name: 'account',
        internalType: 'address',
      },
      {
        type: 'uint256',
        name: 'expiration',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: '_setWhitelistGuardian',
    inputs: [
      {
        type: 'address',
        name: 'account',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'address', name: '', internalType: 'address' }],
    name: 'admin',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'cancel',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'castVote',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
      {
        type: 'uint8',
        name: 'support',
        internalType: 'uint8',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'castVoteBySig',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
      {
        type: 'uint8',
        name: 'support',
        internalType: 'uint8',
      },
      { type: 'uint8', name: 'v', internalType: 'uint8' },
      {
        type: 'bytes32',
        name: 'r',
        internalType: 'bytes32',
      },
      { type: 'bytes32', name: 's', internalType: 'bytes32' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'castVoteWithReason',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
      {
        type: 'uint8',
        name: 'support',
        internalType: 'uint8',
      },
      { type: 'string', name: 'reason', internalType: 'string' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'payable',
    outputs: [],
    name: 'execute',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'address[]',
        name: 'targets',
        internalType: 'address[]',
      },
      {
        type: 'uint256[]',
        name: 'values',
        internalType: 'uint256[]',
      },
      {
        type: 'string[]',
        name: 'signatures',
        internalType: 'string[]',
      },
      {
        type: 'bytes[]',
        name: 'calldatas',
        internalType: 'bytes[]',
      },
    ],
    name: 'getActions',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'tuple',
        name: '',
        internalType: 'struct GovernorBravoDelegateStorageV1.Receipt',
        components: [
          {
            type: 'bool',
            name: 'hasVoted',
            internalType: 'bool',
          },
          {
            type: 'uint8',
            name: 'support',
            internalType: 'uint8',
          },
          {
            type: 'uint96',
            name: 'votes',
            internalType: 'uint96',
          },
        ],
      },
    ],
    name: 'getReceipt',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
      {
        type: 'address',
        name: 'voter',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'address', name: '', internalType: 'address' }],
    name: 'implementation',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'initialProposalId',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'initialize',
    inputs: [
      {
        type: 'address',
        name: 'timelock_',
        internalType: 'address',
      },
      {
        type: 'address',
        name: 'moo_',
        internalType: 'address',
      },
      {
        type: 'uint256',
        name: 'votingPeriod_',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'votingDelay_',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'proposalThreshold_',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'bool', name: '', internalType: 'bool' }],
    name: 'isWhitelisted',
    inputs: [
      {
        type: 'address',
        name: 'account',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'latestProposalIds',
    inputs: [{ type: 'address', name: '', internalType: 'address' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'address',
        name: '',
        internalType: 'contract CompInterface',
      },
    ],
    name: 'moo',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'string', name: '', internalType: 'string' }],
    name: 'name',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'address', name: '', internalType: 'address' }],
    name: 'pendingAdmin',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'proposalCount',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'proposalMaxOperations',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'proposalThreshold',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      { type: 'uint256', name: 'id', internalType: 'uint256' },
      {
        type: 'address',
        name: 'proposer',
        internalType: 'address',
      },
      { type: 'uint256', name: 'eta', internalType: 'uint256' },
      {
        type: 'uint256',
        name: 'startBlock',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'endBlock',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'forVotes',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'againstVotes',
        internalType: 'uint256',
      },
      {
        type: 'uint256',
        name: 'abstainVotes',
        internalType: 'uint256',
      },
      { type: 'bool', name: 'canceled', internalType: 'bool' },
      {
        type: 'bool',
        name: 'executed',
        internalType: 'bool',
      },
    ],
    name: 'proposals',
    inputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'propose',
    inputs: [
      {
        type: 'address[]',
        name: 'targets',
        internalType: 'address[]',
      },
      {
        type: 'uint256[]',
        name: 'values',
        internalType: 'uint256[]',
      },
      {
        type: 'string[]',
        name: 'signatures',
        internalType: 'string[]',
      },
      {
        type: 'bytes[]',
        name: 'calldatas',
        internalType: 'bytes[]',
      },
      {
        type: 'string',
        name: 'description',
        internalType: 'string',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [],
    name: 'queue',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'quorumVotes',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'uint8',
        name: '',
        internalType: 'enum GovernorBravoDelegateStorageV1.ProposalState',
      },
    ],
    name: 'state',
    inputs: [
      {
        type: 'uint256',
        name: 'proposalId',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      {
        type: 'address',
        name: '',
        internalType: 'contract TimelockInterface',
      },
    ],
    name: 'timelock',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'votingDelay',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'votingPeriod',
    inputs: [],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'uint256', name: '', internalType: 'uint256' }],
    name: 'whitelistAccountExpirations',
    inputs: [{ type: 'address', name: '', internalType: 'address' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [{ type: 'address', name: '', internalType: 'address' }],
    name: 'whitelistGuardian',
    inputs: [],
  },
];

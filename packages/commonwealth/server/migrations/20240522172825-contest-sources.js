'use strict';

const { QueryTypes } = require('sequelize');
const { hasher } = require('node-object-hash');

const namespaceFactoryAbi = [
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ConfiguredCommunityStakeId',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_feeManager',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_namespaceDeployer',
        type: 'address',
      },
    ],
    name: 'DeployedNamespace',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'contest',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'namespace',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'interval',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'oneOff',
        type: 'bool',
      },
    ],
    name: 'NewContest',
    type: 'event',
  },
  {
    inputs: [],
    name: 'CurveManager',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'communityStake',
    outputs: [
      {
        internalType: 'address',
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
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'exchangeToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'scalar',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'curve',
        type: 'uint256',
      },
    ],
    name: 'configureCommunityStakeId',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestFactoryUtil',
    outputs: [
      {
        internalType: 'contract IContestFactoryUtils',
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
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_uri',
        type: 'string',
      },
      {
        internalType: 'address',
        name: '_feeManager',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
    ],
    name: 'deployNamespace',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'getNamespace',
    outputs: [
      {
        internalType: 'address',
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
        name: '_communityStake',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_namespaceLogic',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_reservationHook',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_curveManager',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceLogic',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceVotingStrategy',
    outputs: [
      {
        internalType: 'contract INamespaceVoteStrategy',
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
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'interval',
        type: 'uint256',
      },
      {
        internalType: 'uint256[]',
        name: 'winnerShares',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'prizeShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'voterShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'feeShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256',
      },
    ],
    name: 'newContest',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256',
      },
      {
        internalType: 'uint256[]',
        name: 'winnerShares',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'voterShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'exhangeToken',
        type: 'address',
      },
    ],
    name: 'newSingleContest',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'onERC1155Received',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_namespaceVotingStrategy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_contestFactoryUtil',
        type: 'address',
      },
    ],
    name: 'reinitialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reservationHook',
    outputs: [
      {
        internalType: 'address',
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
        name: '_hook',
        type: 'address',
      },
    ],
    name: 'setReservationHook',
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
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
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
    inputs: [
      {
        internalType: 'address',
        name: 'newUtil',
        type: 'address',
      },
    ],
    name: 'updateContestUtilImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'updateNamespaceImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const contestAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'addContent',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'contentId',
        type: 'uint256',
        indexed: true,
      },
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
        indexed: true,
      },
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
        indexed: false,
      },
    ],
    type: 'event',
    name: 'ContentAdded',
    anonymous: false,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'voteContent',
  },
  {
    inputs: [],
    stateMutability: 'view',
    type: 'function',
    name: 'endTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    inputs: [],
    stateMutability: 'view',
    type: 'function',
    name: 'startTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    inputs: [],
    name: 'contestInterval',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentContentId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestToken',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWinnerIds',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'contestId',
        type: 'uint256',
      },
    ],
    name: 'getPastWinners',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'content',
    outputs: [
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'cumulativeVotes',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'completed',
        type: 'bool',
      },
    ],
  },
  {
    inputs: [],
    name: 'FeeMangerAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const hashInstance = hasher({
  coerce: true,
  sort: true,
  trim: true,
  alg: 'sha256',
  enc: 'hex',
});

const namespaceFactoryHash = hashInstance.hash(namespaceFactoryAbi);
const contestHash = hashInstance.hash(contestAbi);

async function uploadABIs(queryInterface, transaction) {
  const namespaceFactoryAbiId = (
    await queryInterface.sequelize.query(
      `
        INSERT INTO "ContractAbis" (abi, verified, created_at, updated_at, nickname, abi_hash)
        VALUES (
            :abi,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            :nickname,
            :abi_hash
        ) RETURNING id;
      `,
      {
        transaction,
        raw: true,
        type: QueryTypes.INSERT,
        replacements: {
          abi: JSON.stringify(namespaceFactoryAbi),
          nickname: 'NamespaceFactoryForContests',
          abi_hash: namespaceFactoryHash,
        },
      },
    )
  )[0][0].id;

  const contestAbiId = (
    await queryInterface.sequelize.query(
      `
        INSERT INTO "ContractAbis" (abi, verified, created_at, updated_at, nickname, abi_hash)
        VALUES (
            :abi,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            :nickname,
            :abi_hash
        ) RETURNING id;
      `,
      {
        transaction,
        raw: true,
        type: QueryTypes.INSERT,
        replacements: {
          abi: JSON.stringify(contestAbi),
          nickname: 'Contest',
          abi_hash: contestHash,
        },
      },
    )
  )[0][0].id;

  return { namespaceFactoryAbiId, contestAbiId };
}

async function getChainNodeIds(queryInterface, transaction) {
  const sepoliaBase = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 84532;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT },
  );
  return {
    sepoliaBaseId: sepoliaBase[0]?.id,
  };
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const { namespaceFactoryAbiId } = await uploadABIs(
        queryInterface,
        transaction,
      );

      const { sepoliaBaseId } = await getChainNodeIds(
        queryInterface,
        transaction,
      );

      const records = [
        {
          chain_node_id: sepoliaBaseId,
          contract_address: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
          event_signature:
            '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
          kind: 'NewContest',
          abi_id: namespaceFactoryAbiId,
        },
      ];

      await queryInterface.bulkInsert('EvmEventSources', records, {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'EvmEventSources',
        {
          kind: ['NewContest'],
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'ContractAbis',
        {
          abi_hash: [namespaceFactoryHash, contestHash],
        },
        { transaction },
      );
    });
  },
};

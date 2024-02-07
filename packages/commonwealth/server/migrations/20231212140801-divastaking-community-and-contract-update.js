'use strict';

const { hasher } = require('node-object-hash');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    // Initial check to determine if migration should proceed
    const communityExists = await queryInterface.sequelize.query(
      `SELECT 1 FROM "Communities" WHERE id = 'divastaking'`,
      { type: Sequelize.QueryTypes.SELECT, transaction },
    );

    const contractExists = await queryInterface.sequelize.query(
      `SELECT 1 FROM "Contracts" WHERE address = '0xBFAbdE619ed5C4311811cF422562709710DB587d'`,
      { type: Sequelize.QueryTypes.SELECT, transaction },
    );

    // If the specific records don't exist, skip the migration logic
    if (communityExists.length === 0 || contractExists.length === 0) {
      await transaction.commit();
      return;
    }

    // Update "Communities" and "Contracts" tables as per your previous script
    await queryInterface.sequelize.query(
      `
      UPDATE "Communities"
      SET network = 'compound',
          type = 'dao'
      WHERE id = 'divastaking';
    `,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `
      UPDATE "Contracts"
      SET address = '0xFb6B7C11a55C57767643F1FF65c34C8693a11A70',
          type = 'compound'
      WHERE address = '0xBFAbdE619ed5C4311811cF422562709710DB587d';
    `,
      { transaction },
    );

    // Insert a new entry into "ContractAbi"
    const abi = [
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
        inputs: [],
        name: 'BALLOT_TYPEHASH',
        outputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'COUNTING_MODE',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'pure',
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
            internalType: 'uint8',
            name: 'support',
            type: 'uint8',
          },
        ],
        name: 'castVote',
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
            name: 'proposalId',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'support',
            type: 'uint8',
          },
          {
            internalType: 'uint8',
            name: 'v',
            type: 'uint8',
          },
          {
            internalType: 'bytes32',
            name: 'r',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: 's',
            type: 'bytes32',
          },
        ],
        name: 'castVoteBySig',
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
            name: 'proposalId',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'support',
            type: 'uint8',
          },
          {
            internalType: 'string',
            name: 'reason',
            type: 'string',
          },
        ],
        name: 'castVoteWithReason',
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
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'payable',
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
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'pure',
        type: 'function',
      },
      {
        inputs: [],
        name: 'name',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
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
        name: 'proposalDeadline',
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
        inputs: [
          {
            internalType: 'uint256',
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'proposalSnapshot',
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
        inputs: [
          {
            internalType: 'uint256',
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'proposalProposer',
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
            internalType: 'uint256',
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'proposalEta',
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
        inputs: [
          {
            internalType: 'uint256',
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'proposalVotes',
        outputs: [
          {
            internalType: 'uint256',
            name: 'againstVotes',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'forVotes',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'abstainVotes',
            type: 'uint256',
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
            name: 'blockNumber',
            type: 'uint256',
          },
        ],
        name: 'quorum',
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
        inputs: [],
        name: 'version',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'votingDelay',
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
        name: 'votingPeriod',
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
        name: 'proposalThreshold',
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
    ];
    const abiData = JSON.stringify(abi);

    const hashInstance = hasher({
      coerce: true,
      sort: true,
      trim: true,
      alg: 'sha256',
      enc: 'hex',
    });

    const abiHash = hashInstance.hash(JSON.parse(abiData));
    await queryInterface.sequelize.query(
      `
      WITH inserted AS (
        INSERT INTO "ContractAbis" ("abi", "abi_hash", "verified", "nickname", "created_at", "updated_at")
        VALUES (:abi, :abiHash, :verified, :nickname, NOW(), NOW())
        RETURNING id
      )
      UPDATE "Contracts"
      SET "abi_id" = (SELECT id FROM inserted)
      WHERE address = '0xFb6B7C11a55C57767643F1FF65c34C8693a11A70';
    `,
      {
        replacements: {
          abi: abiData,
          abiHash: abiHash,
          verified: true,
          nickname: 'GovernorCountingSimple',
        },
        type: Sequelize.QueryTypes.INSERT,
        transaction,
      },
    );

    await transaction.commit();
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Revert changes made to "Contracts" table - set abi_id back to original
      await queryInterface.sequelize.models.Contract.update(
        {
          abi_id: 1, // original abi_id
        },
        {
          where: {
            address: '0xFb6B7C11a55C57767643F1FF65c34C8693a11A70',
          },
          transaction,
        },
      );

      // Delete the newly created entry in "ContractAbi" table
      await queryInterface.sequelize.models.ContractAbi.destroy({
        where: {
          nickname: 'GovernorCountingSimple',
        },
        transaction,
      });

      // Revert changes made to "Communities" table
      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET network = 'ethereum',
            type = 'erc20'
        WHERE id = 'divastaking';
      `,
        { transaction },
      );

      // Revert changes made to "Contracts" table (for address and type)
      await queryInterface.sequelize.query(
        `
        UPDATE "Contracts"
        SET address = '0xBFAbdE619ed5C4311811cF422562709710DB587d',
            type = 'erc20'
        WHERE address = '0xFb6B7C11a55C57767643F1FF65c34C8693a11A70';
      `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

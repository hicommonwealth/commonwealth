'use strict';

const { QueryTypes } = require('sequelize');
const { hasher } = require('node-object-hash');

const namespaceFactoryAbi = [
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      {
        indexed: false,
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'ConfiguredCommunityStakeId',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
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
    inputs: [],
    name: 'CurveManager',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'communityStake',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'address',
        name: 'exchangeToken',
        type: 'address',
      },
      { internalType: 'uint256', name: 'scalar', type: 'uint256' },
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
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'string',
        name: '_uri',
        type: 'string',
      },
      { internalType: 'address', name: '_feeManager', type: 'address' },
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
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'getNamespace',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
      { internalType: 'address', name: '_namespaceLogic', type: 'address' },
      {
        internalType: 'address',
        name: '_reservationHook',
        type: 'address',
      },
      { internalType: 'address', name: '_curveManager', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceLogic',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reservationHook',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_hook', type: 'address' }],
    name: 'setReservationHook',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
    ],
    name: 'updateNamespaceImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
const communityStakesAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_feeDestination',
        type: 'address',
      },
      { internalType: 'address', name: '_factory', type: 'address' },
      {
        internalType: 'uint256',
        name: '_protocolFee',
        type: 'uint256',
      },
      { internalType: 'uint256', name: '_namespaceFee', type: 'uint256' },
      {
        internalType: 'address',
        name: '_curveManager',
        type: 'address',
      },
      { internalType: 'uint256', name: '_supplyCap', type: 'uint256' },
      {
        internalType: 'address',
        name: '_supplyCapGuardian',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ internalType: 'address', name: 'target', type: 'address' }],
    name: 'AddressEmptyCode',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'AddressInsufficientBalance',
    type: 'error',
  },
  { inputs: [], name: 'FailedInnerCall', type: 'error' },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error',
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
        internalType: 'address',
        name: 'trader',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'namespace',
        type: 'address',
      },
      { indexed: false, internalType: 'bool', name: 'isBuy', type: 'bool' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'communityTokenAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'ethAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'protocolEthAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nameSpaceEthAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'supply',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'exchangeToken',
        type: 'address',
      },
    ],
    name: 'Trade',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address[]', name: 'tokens', type: 'address[]' }],
    name: 'blacklistTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bondingCurveAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'buyStake',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'curveId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'getBuyPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'getBuyPriceAfterFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'getDecimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_supply', type: 'uint256' },
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'getPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'getSellPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'getSellPriceAfterFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceFeePercent',
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
    inputs: [],
    name: 'protocolFeeDestination',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeePercent',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'sellStake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_bondingCurveAddress',
        type: 'address',
      },
    ],
    name: 'setBondingCurveAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_factory', type: 'address' }],
    name: 'setFactory',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_feeDestination', type: 'address' },
    ],
    name: 'setFeeDestination',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'supplyCapGuardian',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'tokenBlacklist',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupplyCap',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newGuardian', type: 'address' }],
    name: 'transferGuardian',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'newCap', type: 'uint256' }],
    name: 'updateSupplyCap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'whitelist',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'namespaceAddress',
        type: 'address',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'address',
        name: 'exchangeToken',
        type: 'address',
      },
      { internalType: 'uint256', name: 'scalar', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'curve',
        type: 'uint256',
      },
    ],
    name: 'whitelistId',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'whitelistedExchangeToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'whitelistedScaler',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
const communityStakesHash = hashInstance.hash(communityStakesAbi);

async function uploadABIs(queryInterface, transaction) {
  // upload NamespaceFactory contract ABI
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
          nickname: 'NamespaceFactory',
          abi_hash: namespaceFactoryHash,
        },
      },
    )
  )[0][0].id;

  const communityStakesAbiId = (
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
          abi: JSON.stringify(communityStakesAbi),
          nickname: 'CommunityStakes',
          abi_hash: communityStakesHash,
        },
      },
    )
  )[0][0].id;

  return { communityStakesAbiId, namespaceFactoryAbiId };
}

async function getChainNodeIds(queryInterface, transaction) {
  const base = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 8453;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT },
  );

  const blast = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 81457;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT },
  );

  const sepoliaBase = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 84532;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT },
  );

  const sepolia = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 11155111;
      `,
    { transaction, raw: true, type: QueryTypes.SELECT },
  );

  return {
    baseId: base[0]?.id,
    blastId: blast[0]?.id,
    sepoliaBaseId: sepoliaBase[0]?.id,
    sepoliaId: sepolia[0]?.id,
  };
}

async function createNewEvmEventSource(queryInterface, transaction) {
  const { namespaceFactoryAbiId, communityStakesAbiId } = await uploadABIs(
    queryInterface,
    transaction,
  );

  const deployedNamespaceEventSource = {
    event_signature:
      '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
    kind: 'DeployedNamespace',
    abi_id: namespaceFactoryAbiId,
  };

  const communityStakesEventSource = {
    event_signature:
      '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
    kind: 'Trade',
    abi_id: communityStakesAbiId,
  };

  const { baseId, blastId, sepoliaBaseId, sepoliaId } = await getChainNodeIds(
    queryInterface,
    transaction,
  );

  const records = [];

  if (baseId > 0) {
    records.push(
      {
        chain_node_id: baseId,
        contract_address: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
        ...deployedNamespaceEventSource,
      },
      {
        chain_node_id: baseId,
        contract_address: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
        ...communityStakesEventSource,
      },
    );
  }

  if (blastId) {
    records.push(
      {
        chain_node_id: blastId,
        contract_address: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
        ...deployedNamespaceEventSource,
      },
      {
        chain_node_id: blastId,
        contract_address: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
        ...communityStakesEventSource,
      },
    );
  }

  if (sepoliaBaseId) {
    records.push(
      {
        chain_node_id: sepoliaBaseId,
        contract_address: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
        ...deployedNamespaceEventSource,
      },
      {
        chain_node_id: sepoliaBaseId,
        contract_address: '0xd097926d8765A7717206559E7d19EECCbBa68c18',
        ...communityStakesEventSource,
      },
    );
  }

  if (sepoliaId) {
    records.push(
      {
        chain_node_id: sepoliaId,
        contract_address: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
        ...deployedNamespaceEventSource,
      },
      {
        chain_node_id: sepoliaId,
        contract_address: '0xf6C1B02257f0Ac4Af5a1FADd2dA8E37EC5f9E5fd',
        ...communityStakesEventSource,
      },
    );
  }

  await queryInterface.bulkInsert('EvmEventSources', records, {
    transaction,
  });
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Outbox', 'id', 'event_id', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Outbox"
        ALTER COLUMN event_id SET NOT NULL;
      `,
        { transaction },
      );

      // link EvmEventSources to an abi directly (bypass Contracts table)
      await queryInterface.addColumn(
        'EvmEventSources',
        'abi_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'ContractAbis',
            key: 'id',
          },
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        WITH CTE AS (
            SELECT ESS.id, CA.id as abi_id
            FROM "EvmEventSources" ESS
            JOIN "Contracts" C ON C.address = ESS.contract_address AND C.chain_node_id = ESS.chain_node_id
            JOIN "ContractAbis" CA ON CA.id = C.abi_id
        )
        UPDATE "EvmEventSources"
        SET abi_id = CTE.abi_id
        FROM CTE
        WHERE "EvmEventSources".id = CTE.id;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "EvmEventSources"
        ALTER COLUMN abi_id SET NOT NULL;
        `,
        { transaction },
      );

      await createNewEvmEventSource(queryInterface, transaction);

      await queryInterface.addColumn(
        'EvmEventSources',
        'created_at_block',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'EvmEventSources',
        'events_migrated',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'EvmEventSources',
        'active',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Communities',
        'namespace_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'EvmEventSources',
        {
          kind: ['DeployedNamespace', 'Trade'],
        },
        { transaction },
      );

      await queryInterface.removeColumn('EvmEventSources', 'created_at_block', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'events_migrated', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'active', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'abi_id', {
        transaction,
      });
      await queryInterface.removeColumn('Communities', 'namespace_address', {
        transaction,
      });

      await queryInterface.bulkDelete(
        'ContractAbis',
        {
          abi_hash: [namespaceFactoryHash, communityStakesHash],
        },
        { transaction },
      );
    });
  },
};

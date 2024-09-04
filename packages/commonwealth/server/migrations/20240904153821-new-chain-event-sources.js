'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const specificEvmChainIds = [59144, 10, 42161, 1];

      const chainNodes = await queryInterface.sequelize.query(
        'SELECT id, eth_chain_id FROM "ChainNodes" WHERE eth_chain_id IN (:evmChainIds)',
        {
          replacements: { evmChainIds: specificEvmChainIds },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      const contractAbis = await queryInterface.sequelize.query(
        'SELECT id, nickname FROM "ContractAbis" WHERE nickname IN (:nicknames)',
        {
          replacements: { nicknames: ['NamespaceFactory', 'CommunityStakes'] },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      const abiIds = {
        NamespaceFactory: contractAbis.find(
          (abi) => abi.nickname === 'NamespaceFactory',
        ).id,
        CommunityStakes: contractAbis.find(
          (abi) => abi.nickname === 'CommunityStakes',
        ).id,
      };

      const hardCodedValueSetsL2 = [
        {
          contract_address: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
          event_signature:
            '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
          kind: 'DeployedNamespace',
          abi_id: abiIds.NamespaceFactory,
          active: true,
        },
        {
          contract_address: '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
          event_signature:
            '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
          kind: 'Trade',
          abi_id: abiIds.CommunityStakes,
          active: true,
        },
        {
          contract_address: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
          event_signature:
            '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
          kind: 'NewContest',
          abi_id: abiIds.NamespaceFactory,
          active: true,
        },
      ];

      const hardCodedValueSetsETH = [
        {
          contract_address: '0x90aa47bf6e754f69ee53f05b5187b320e3118b0f',
          event_signature:
            '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
          kind: 'DeployedNamespace',
          abi_id: abiIds.NamespaceFactory,
          active: true,
        },
        {
          contract_address: '0x9ed281e62db1b1d98af90106974891a4c1ca3a47',
          event_signature:
            '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
          kind: 'Trade',
          abi_id: abiIds.CommunityStakes,
          active: true,
        },
        {
          contract_address: '0x90aa47bf6e754f69ee53f05b5187b320e3118b0f',
          event_signature:
            '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
          kind: 'NewContest',
          abi_id: abiIds.NamespaceFactory,
          active: true,
        },
      ];

      const records = chainNodes.flatMap((node) => {
        if (node.eth_chain_id == 1) {
          return hardCodedValueSetsETH.map((valueSet) => ({
            chain_node_id: node.id,
            ...valueSet,
          }));
        } else {
          return hardCodedValueSetsL2.map((valueSet) => ({
            chain_node_id: node.id,
            ...valueSet,
          }));
        }
      });

      await queryInterface.bulkInsert('EvmEventSources', records, {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const chainNodes = await queryInterface.sequelize.query(
        'SELECT id, eth_chain_id FROM "ChainNodes" WHERE eth_chain_id IN (:evmChainIds)',
        {
          replacements: { evmChainIds: [59144, 10, 42161, 1] },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      const chainNodeIds = chainNodes.map((node) => node.id);

      const contractAddressesL2 = [
        '0xedf43C919f59900C82d963E99d822dA3F95575EA',
        '0xcc752fd15A7Dd0d5301b6A626316E7211352Cf62',
        '0xedf43C919f59900C82d963E99d822dA3F95575EA',
      ];

      const contractAddressesETH = [
        '0x90aa47bf6e754f69ee53f05b5187b320e3118b0f',
        '0x9ed281e62db1b1d98af90106974891a4c1ca3a47',
        '0x90aa47bf6e754f69ee53f05b5187b320e3118b0f',
      ];

      await queryInterface.bulkDelete(
        'EvmEventSources',
        {
          chain_node_id: chainNodeIds,
          [Sequelize.Op.or]: [
            { contract_address: contractAddressesL2 },
            { contract_address: contractAddressesETH },
          ],
        },
        { transaction },
      );
    });
  },
};

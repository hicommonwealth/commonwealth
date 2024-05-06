'use strict';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Web3 } = require('web3');

const factoryContracts = {
  11155111: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
  84532: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
  81457: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
  8453: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
};

async function getNamespace(web3, namespace, factoryAddress) {
  const factory = new web3.eth.Contract(
    [
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'getNamespace',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
      },
    ],
    factoryAddress,
  );
  const hexString = web3.utils.utf8ToHex(namespace);
  const activeNamespace = await factory.methods
    .getNamespace(hexString.padEnd(66, '0'))
    .call();
  return activeNamespace;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const communities = await queryInterface.sequelize.query(
      `
        SELECT C.id, C.namespace,
        COALESCE(CN.private_url, CN.url) as url,
        CN.eth_chain_id
        FROM "Communities" C
        JOIN "ChainNodes" CN ON C.chain_node_id = CN.id
        WHERE C.namespace IS NOT NULL AND eth_chain_id IN (8453, 84532, 11155111, 81457);
      `,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    let values = ``;
    if (communities.length !== 0) {
      const web3Providers = {};

      for (const community of communities) {
        if (!web3Providers[community.eth_chain_id]) {
          web3Providers[community.eth_chain_id] = new Web3(community.url);
        }

        const web3 = web3Providers[community.eth_chain_id];

        const namespaceAddress = await getNamespace(
          web3,
          community.namespace,
          factoryContracts[community.eth_chain_id],
        );

        if (!namespaceAddress) {
          console.error('Namespace address not found', {
            namespace: community.namespace,
            eth_chain_id: community.eth_chain_id,
            community_id: community.id,
          });
        }

        console.log(
          `Namespace address for ${community.id}: ${namespaceAddress}`,
        );

        values += `('${community.id}', '${namespaceAddress}'),`;
      }

      values = values.slice(0, -1);
    }

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'namespace_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      if (communities.length !== 0) {
        await queryInterface.sequelize.query(
          `
        UPDATE "Communities" C
        SET namespace_address = C2.namespace_address
        FROM (VALUES
            ${values}
        ) as C2(id, namespace_address)
        WHERE C.id = C2.id;
      `,
          { transaction, logging: console.log },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Communities', 'namespace_address');
  },
};

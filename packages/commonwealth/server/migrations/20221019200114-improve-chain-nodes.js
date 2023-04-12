'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Add Columns
      await queryInterface.addColumn(
        'ChainNodes',
        'ss58',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'ChainNodes',
        'bech32',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'ChainNodes',
        'created_at',
        {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: new Date(),
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'ChainNodes',
        'updated_at',
        {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: new Date(),
        },
        { transaction }
      );

      await queryInterface.removeColumn('ChainNodes', 'chain_base', {
        transaction,
      });

      // Add entry names
      const chainNodes = [
        {
          name: 'Harmony',
          url: 'wss://ws.s0.t.hmny.io/',
        },
        {
          name: 'Matic',
          url: 'wss://ws-matic-mainnet.chainstacklabs.com',
        },
        {
          name: 'Straightedge',
          url: 'wss://straightedge.commonwealth.im',
          bech32: 'str',
        },
        {
          name: 'Stafi',
          url: 'wss://scan-rpc.stafi.io/',
          ss58: 20,
        },
        {
          name: 'xDAI',
          url: 'wss://rpc.xdaichain.com/wss',
        },
        {
          name: 'Polkadot',
          url: 'wss://rpc.polkadot.io',
          ss58: 0,
        },
        {
          name: 'Plasmnet',
          url: 'wss://rpc.plasmnet.io/',
          ss58: 5,
        },
        {
          name: 'Kulupu',
          url: 'wss://rpc.kulupu.corepaper.org/ws',
          ss58: 16,
        },
        {
          name: 'Darwinia',
          url: 'wss://rpc.darwinia.network/',
          ss58: 18,
        },
        {
          name: 'HydraDX',
          url: 'wss://rpc-01.snakenet.hydradx.io/',
          ss58: 63,
        },
        {
          name: 'Ronin',
          url: 'wss://ronin-rpc.commonwealth.im/wss',
        },
        {
          name: 'Polygon (Mumbai)',
          url: 'wss://polygon-mumbai.g.alchemy.com/v2/HaGTCcKYKQyX68DYEa9_6F5E7ASxhoAS',
        },
        {
          name: 'Fantom',
          url: 'wss://misty-rough-haze.fantom.quiknode.pro/cf2cf5b4d7fbf487e2ea8affcbd876219fe6576e/',
        },
        {
          name: 'ChainX',
          url: 'wss://mainnet.chainx.org/ws',
          ss58: 44,
        },
        {
          name: 'Nodle Protocol',
          url: 'wss://main3.nodleprotocol.io',
          ss58: 37,
        },
        {
          name: 'Khala Chain',
          url: 'wss://khala-api.phala.network/ws',
          ss58: 30,
        },
        {
          name: 'BSC',
          url: 'wss://holy-spring-wave.bsc.quiknode.pro/a6955f0547ae82229a6379ca6f16fd672cb997eb/',
        },
        {
          name: 'Centrifuge',
          url: 'wss://fullnode.centrifuge.io/',
          ss58: 36,
        },
        {
          name: 'Celo',
          url: 'wss://forno.celo.org/ws',
        },
        {
          name: 'Ethereum (Ropsten)',
          url: 'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
        },
        {
          name: 'Ethereum (Mainnet)',
          url: 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_',
          balance_type: 'ethereum',
        },
        {
          name: 'Edgeware (Mainnet)',
          url: 'wss://edgeware-rpc.dwellir.com',
          balance_type: 'substrate',
          ss58: 7,
        },
        {
          name: 'Arbitrum (Mainnet)',
          url: 'wss://arb-mainnet.g.alchemy.com/v2/wJE2b7MRNJgk7S8dfgb_1xZNUDq7SF7G',
        },
        {
          name: 'Crust Network',
          url: 'wss://api.crust.network/',
          ss58: 66,
        },
        {
          name: 'Kusama',
          url: 'ws://kusama-rpc.polkadot.io:9944',
          ss58: 2,
        },
        {
          name: 'Edgeware (Testnet)',
          url: 'ws://beresheet1.edgewa.re:9944',
          ss58: 7,
        },
        {
          name: 'CLV Chain (Clover)',
          url: 'ws://api.clover.finance/',
          ss58: 42,
        },
        {
          name: 'Solana (Testnet)',
          url: 'testnet',
        },
        {
          name: 'Solana (Mainnet beta)',
          url: 'mainnet-beta',
        },
        {
          name: 'Cosmos (localhost)',
          url: 'localhost:26657',
          bech32: 'cosmos',
        },
        {
          name: 'Carbon Network',
          url: 'https://tm-api.carbon.network',
          bech32: 'swth',
        },
        {
          name: 'Evmos',
          url: 'https://tendermint.bd.evmos.org:26657/',
          bech32: 'evmos',
        },
        {
          name: 'Polkachu',
          url: 'https://stride-rpc.polkachu.com/',
          bech32: 'stride',
        },
        {
          name: 'Haqq Network',
          url: 'https://rpc.tm.haqq.network',
          bech32: 'haqq',
        },
        {
          name: 'NEAR (Testnet)',
          url: 'https://rpc.testnet.near.org',
        },
        {
          name: 'Stargaze',
          url: 'https://rpc.stargaze-apis.com/',
          bech32: 'stars',
        },
        {
          name: 'Sifchain',
          url: 'https://rpc.sifchain.finance/',
          bech32: 'sif',
        },
        {
          name: 'Osmosis',
          url: 'https://rpc-osmosis.blockapsis.com',
          bech32: 'osmo',
        },
        {
          name: 'Oraichain',
          url: 'https://rpc.orai.io',
          bech32: 'orai',
        },
        {
          name: 'NEAR (Mainnet)',
          url: 'https://rpc.mainnet.near.org',
        },
        {
          name: 'Juno',
          url: 'https://rpc-juno.itastakers.com',
          bech32: 'juno',
        },
        {
          name: 'Wynd',
          url: 'https://rpc-juno-wynd.mib.tech',
          bech32: 'juno',
        },
        {
          name: 'Panacea',
          url: 'https://rpc.gopanacea.org/',
          bech32: 'panacea',
        },
        {
          name: 'Bitsong',
          url: 'https://rpc.explorebitsong.com',
          bech32: 'bitsong',
        },
        {
          name: 'Persistence',
          url: 'https://rpc.core.persistence.one',
          bech32: 'persistence',
        },
        {
          name: 'Archway',
          url: 'https://rpc.constantine-1.archway.tech',
          bech32: 'archway',
        },
        {
          name: 'Chihuahua',
          url: 'https://rpc.chihuahua.wtf:443',
          bech32: 'chihuahua',
        },
        {
          name: 'Cheqd',
          url: 'https://rpc.cheqd.net',
          bech32: 'cheqd',
        },
        {
          name: 'Cerberus',
          url: 'https://rpc.cerberus.zone:26657/',
          bech32: 'cerberus',
        },
        {
          name: 'Umee',
          url: 'https://rpc.blue.main.network.umee.cc/',
          bech32: 'umee',
        },
        {
          name: 'Agoric',
          url: 'https://main.rpc.agoric.net:443/',
          bech32: 'agoric',
        },
        {
          name: 'Vidulum (Mainnet)',
          url: 'https://mainnet-rpc.vidulum.app/',
          bech32: 'vdl',
        },
        {
          name: 'Crescent Network',
          url: 'https://mainnet.crescent.network:26657/',
          bech32: 'cre',
        },
        {
          name: 'Terra',
          url: 'https://phoenix-lcd.terra.dev',
          bech32: 'terra',
        },
        {
          name: 'Injective (Testnet)',
          url: 'https://injective-rpc-testnet.cw-figment.workers.dev',
          bech32: 'inj',
        },
        {
          name: 'Injective (Mainnet)',
          url: 'https://injective-rpc.cw-figment.workers.dev',
          bech32: 'inj',
        },
        {
          name: 'Gravity Chain',
          url: 'https://gravitychain.io:26657/',
          bech32: 'gravity',
        },
        {
          name: 'Andromeda (Testnet)',
          url: 'https://andromeda-testnet-rpc.orbitalcommand.io',
          bech32: 'andr',
        },
        {
          name: 'Regen Network',
          url: 'http://public-rpc.regen.vitwit.com:26657/',
          bech32: 'regen',
        },
        {
          name: 'Althea',
          url: 'http://chainripper-2.althea.net:26657/',
          bech32: 'gravity',
        },
        {
          name: 'ODIN Protocol',
          url: 'http://34.79.179.216:26657',
          bech32: 'odin',
        },
        {
          name: 'Solana (Devnet)',
          url: 'devnet',
        },
      ];

      // TODO: rectify balance_type, ss58, and bech32 values for each node

      await Promise.all(
        chainNodes.map(async (cn) => {
          const update = { name: cn.name };
          if (cn.balance_type) update['balance_type'] = cn.balance_type;
          if (cn.ss58 !== undefined) update['ss58'] = cn.ss58;
          if (cn.bech32) update['bech32'] = cn.bech32;
          await queryInterface.bulkUpdate(
            'ChainNodes',
            update,
            { url: cn.url },
            { transaction }
          );
        })
      );

      // fix two chains and remove duplicates
      await queryInterface.bulkUpdate(
        'Chains',
        { chain_node_id: 17 },
        { id: 'neta-money' },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { chain_node_id: 20 },
        { id: 'clandestina' },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'CommunityRoles',
        { chain_id: 'ethereum-local' },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'CommunityRoles',
        { chain_id: 'ideamarket' },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'CommunityContracts',
        { chain_id: 'ethereum-local' },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'CommunityContracts',
        { chain_id: 'ideamarket' },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'ethereum-local' },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'ideamarket' },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'Contracts',
        { chain_node_id: 21 },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { id: 18 },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { id: 21 },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET name = REGEXP_REPLACE(url, 'https?://', 'Imported node:');`,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );
      await queryInterface.changeColumn(
        'ChainNodes',
        'name',
        { type: Sequelize.STRING, allowNull: false },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'ChainNodes',
        'name',
        { type: Sequelize.STRING, allowNull: true },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        { name: null, description: null },
        {},
        { transaction }
      );
      await queryInterface.removeColumn('ChainNodes', 'ss58', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'bech32', {
        transaction,
      });
      await queryInterface.removeColumn('ChainNodes', 'created_at', {
        transaction,
      });
      await queryInterface.removeColumn('ChainNodes', 'updated_at', {
        transaction,
      });
      await queryInterface.addColumn(
        'ChainNodes',
        'chain_base',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        { transaction }
      );
    });
  },
};

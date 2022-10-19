'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {

      // Add Columns
      await queryInterface.addColumn('ChainNodes', 'ss58', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('ChainNodes', 'bech32', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('ChainNodes', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      }, { transaction });

      await queryInterface.addColumn('ChainNodes', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      }, { transaction });


      // Add entry names
      const chainNodes = [
        {
          name: 'Harmony',
          url: 'wss://ws.s0.t.hmny.io/'
        },
        {
          name: 'Matic',
          url: 'wss://ws-matic-mainnet.chainstacklabs.com'
        },
        {
          name: 'Straightedge',
          url: 'wss://straightedge.commonwealth.im'
        },
        {
          name: 'Stafi',
          url: 'wss://scan-rpc.stafi.io/'
        },
        {
          name: 'xDAI',
          url: 'wss://rpc.xdaichain.com/wss'
        },
        {
          name: 'Polkadot',
          url: 'wss://rpc.polkadot.io/'
        },
        {
          name: 'Plasmnet',
          url: 'wss://rpc.plasmnet.io/'
        },
        {
          name: 'Kulupu',
          url: 'wss://rpc.kulupu.corepaper.org/ws'
        },
        {
          name: 'Darwinia',
          url: 'wss://rpc.darwinia.network/'
        },
        {
          name: 'HydraDX',
          url: 'wss://rpc-01.snakenet.hydradx.io/'
        },
        {
          name: 'Ronin',
          url: 'wss://ronin-rpc.commonwealth.im/wss'
        },
        {
          name: 'Polygon (Mumbai)',
          url: 'wss://polygon-mumbai.g.alchemy.com/v2/HaGTCcKYKQyX68DYEa9_6F5E7ASxhoAS'
        },
        {
          name: 'Fantom',
          url: 'wss://misty-rough-haze.fantom.quiknode.pro/cf2cf5b4d7fbf487e2ea8affcbd876219fe6576e'
        },
        {
          name: 'ChainX',
          url: 'wss://mainnet.chainx.org/ws'
        },
        {
          name: 'Nodle Protocol',
          url: 'wss://main3.nodleprotocol.io'
        },
        {
          name: 'Khala Chain',
          url: 'wss://khala-api.phala.network/ws'
        },
        {
          name: 'BSC',
          url: 'wss://holy-spring-wave.bsc.quiknode.pro/a6955f0547ae82229a6379ca6f16fd672cb997eb/'
        },
        {
          name: 'Centrifuge',
          url: 'wss://fullnode.centrifuge.io/'
        },
        {
          name: 'Celo',
          url: 'wss://forno.celo.org/ws'
        },
        {
          name: 'Ethereum (Ropsten)',
          url: 'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7'
        },
        {
          name: 'Ethereum (Mainnet)',
          url: 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_'
        },
        {
          name: 'Edgeware (Mainnet)',
          url: 'wss://edgeware-rpc.dwellir.com'
        },
        {
          name: 'Arbitrum (Mainnet)',
          url: 'wss://arb-mainnet.g.alchemy.com/v2/wJE2b7MRNJgk7S8dfgb_1xZNUDq7SF7G'
        },
        {
          name: 'Crust Network',
          url: 'wss://api.crust.network/'
        },
        {
          name: 'Kusama',
          url: 'ws://kusama-rpc.polkadot.io:9944'
        },
        {
          name: 'Edgeware (Testnet)',
          url: 'ws://beresheet1.edgewa.re:9944'
        },
        {
          name: 'CLV Chain (Clover)',
          url: 'ws://api.clover.finance/'
        },
        {
          name: 'Solana (Testnet)',
          url: 'testnet'
        },
        {
          name: 'Solana (Mainnet beta)',
          url: 'mainnet-beta'
        },
        {
          name: 'Cosmos (localhost)',
          url: 'localhost:26657'
        },
        {
          name: 'Carbon Network',
          url: 'https://tm-api.carbon.network'
        },
        {
          name: 'Evmos',
          url: 'https://tendermint.bd.evmos.org:26657/'
        },
        {
          name: 'Polkachu',
          url: 'https://stride-rpc.polkachu.com/'
        },
        {
          name: 'Haqq Network',
          url: 'https://rpc.tm.haqq.network'
        },
        {
          name: 'NEAR (Testnet)',
          url: 'https://rpc.testnet.near.org'
        },
        {
          name: 'Stargaze',
          url: 'https://rpc.stargaze-apis.com/'
        },
        {
          name: 'Sifchain',
          url: 'https://rpc.sifchain.finance/'
        },
        {
          name: 'Osmosis',
          url: 'https://rpc-osmosis.blockapsis.com'
        },
        {
          name: 'Oraichain',
          url: 'https://rpc.orai.io'
        },
        {
          name: 'NEAR (Mainnet)',
          url: 'https://rpc.mainnet.near.org'
        },
        {
          name: 'Juno',
          url: 'https://rpc-juno.itastakers.com'
        },
        {
          name: 'Panacea',
          url: 'https://rpc.gopanacea.org'
        },
        {
          name: 'Bitsong',
          url: 'https://rpc.explorebitsong.com'
        },
        {
          name: 'Persistence',
          url: 'https://rpc.core.persistence.one'
        },
        {
          name: 'Archway',
          url: 'https://rpc.constantine-1.archway.tech'
        },
        {
          name: 'Chihuahua',
          url: 'https://rpc.chihuahua.wtf:443'
        },
        {
          name: 'Cheqd',
          url: 'https://rpc.cheqd.net'
        },
        {
          name: 'Cerberus',
          url: 'https://rpc.cerberus.zone:26657'
        },
        {
          name: 'Umee',
          url: 'https://rpc.blue.main.network.umee.cc'
        },
        {
          name: 'Agoric',
          url: 'https://main.rpc.agoric.net:443/'
        },
        {
          name: 'Vidulum (Mainnet)',
          url: 'https://mainnet-rpc.vidulum.app'
        },
        {
          name: 'Crescent Network',
          url: 'https://mainnet.crescent.network:26657'
        },
        {
          name: 'Terra',
          url: 'https://lcd.phoenix.terra.setten.io/5e351408cfc5460186aa77ff1f38fac9'
        },
        {
          name: 'Injective (Testnet)',
          url: 'https://injective-rpc-testnet.cw-figment.workers.dev'
        },
        {
          name: 'Injective (Mainnet)',
          url: 'https://injective-rpc.cw-figment.workers.dev'
        },
        {
          name: 'Gravity Chain',
          url: 'https://gravitychain.io:26657'
        },
        {
          name: 'Andromeda (Testnet)',
          url: 'https://andromeda-testnet-rpc.orbitalcommand.io'
        },
        {
          name: 'Regen Network',
          url: 'http://public-rpc.regen.vitwit.com:26657'
        },
        {
          name: 'Althea',
          url: 'http://chainripper-2.althea.net:26657'
        },
        {
          name: 'ODIN Protocol',
          url: 'http://34.79.179.216:26657'
        },
        {
          name: 'Solana (Devnet)',
          url: 'devnet'
        },
      ];

      await Promise.all(chainNodes.map(async (cn) => {
        const query = `UPDATE "ChainNodes" SET name='${cn.name}' WHERE url LIKE '${cn.url}%';`;
        queryInterface.sequelize.query(query, { transaction });
      }))

    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`UPDATE "ChainNodes" SET name=NULL;`, { transaction });
      await queryInterface.sequelize.query(`UPDATE "ChainNodes" SET description=NULL;`, { transaction });
      await queryInterface.removeColumn('ChainNodes', 'ss58', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'bech32', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'created_at', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'updated_at', { transaction });
    });
  }
};

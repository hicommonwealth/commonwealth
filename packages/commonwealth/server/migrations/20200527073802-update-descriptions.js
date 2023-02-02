/* eslint-disable max-len */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        "UPDATE \"Chains\" SET description='A cutting-edge smart contract blockchain, built to solve decentralized governance' WHERE id='edgeware';"
      ),
      queryInterface.sequelize.query(
        "UPDATE \"Chains\" SET description='A global, open-source platform for decentralized applications' WHERE id='ethereum';"
      ),
      queryInterface.sequelize.query(
        "UPDATE \"Chains\" SET description='A canary network for Polkadot' WHERE id='kusama';"
      ),
      queryInterface.sequelize.query(
        "UPDATE \"Chains\" SET description='An ecosystem of creators and operators building decentralized applications' WHERE id='metacartel';"
      ),
      queryInterface.sequelize.query(
        "UPDATE \"Chains\" SET description='The on-chain funding cooperative on Ethereum' WHERE id='moloch';"
      ),
      queryInterface.sequelize.query(
        "UPDATE \"Chains\" SET description='A next-generation blockchain focused on usability and performance' WHERE id='near';"
      ),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return new Promise();
  },
};

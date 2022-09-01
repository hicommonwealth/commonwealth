'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addConstraint('ChainNodes', {
            name: 'ChainNodes_unique_url',
            fields: ['url'],
            type: 'unique',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeConstraint('ChainNodes', 'ChainNodes_unique_url');
    }
};

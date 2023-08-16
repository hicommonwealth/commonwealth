'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Contracts',
        'gov_version',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Contracts"
        SET gov_version = CASE
            WHEN address = '0xde457ed1A713C290C4f8dE1dE0D0308Fc7722937' THEN 'bravo'
            WHEN address = '0x0BEF27FEB58e857046d630B2c03dFb7bae567494' THEN 'oz-bravo'
            WHEN address = '0x2B6BCCa642Aee17EfEDB45018fd111B190930421' THEN 'oz'
            WHEN address = '0xac4610582926DcF22bf327AbB6F6aC82BD49FE0f' THEN 'bravo'
            WHEN address = '0xd74034C6109A23B6c7657144cAcBbBB82BDCB00E' THEN 'alpha'
            WHEN address = '0xC4e172459f1E7939D522503B81AFAaC1014CE6F6' THEN 'alpha'
            WHEN address = '0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4' THEN 'bravo'
            WHEN address = '0x777992c2E4EDF704e49680468a9299C6679e37F6' THEN 'alpha'
        END
        WHERE type = 'compound';
      `,
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Contracts', 'gov_version');
  },
};

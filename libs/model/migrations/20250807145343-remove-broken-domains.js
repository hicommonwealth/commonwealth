'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Communities"
      SET custom_domain = NULL
      WHERE id IN ('dao.alphafinance.io', 'discuss.ape.bond', 'dockyard.sei.network', 'dydx.commonwealth.im', 'forum.aurora.dev',
      'forum.axieinfinity.com', 'forum.clandestinadao.com', 'forum.coinflex.com', 'forum.element.fi', 'forum.notional.finance',
      'forum.plasma.finance', 'forum.redacted.finance', 'forum.regen.network', 'forum.seedx.community', 'forum.spookyswap.finance',
      'forum.stargate.finance', 'forum.swellnetwork.io', 'forum.synonym.finance', 'forum.treasure.lol', 'gov.bio.xyz',
      'gov.athenadao.co', 'gov.buzzedbearhideout.com', 'gov.elys.network', 'governance.allianceblock.io', 'governance.elys.network',
      'gov.euler.finance', 'gov.injective.network', 'gov.israelshouse2.xyz', 'gov.israelshouse.xyz', 'gov.kylin.network',
      'gov.marlin.org', 'gov.odinprotocol.io', 'gov.openkey.dev', 'gov.osmosis.zone', 'gov.treasure.lol', 'gov.umee.cc',
      'israel.9999.xyz', 'israel.999.xyz', 'rfp.layerzero.network', 'temp3.affinity.fun', 'this.israelshouse.xyz', 'vote.impossible.finance',
      'yo.israelshouse.xyz');
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};

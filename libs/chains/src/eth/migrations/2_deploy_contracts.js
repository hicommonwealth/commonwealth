const GuildBankV2 = artifacts.require('GuildBank2');
const HelperV2 = artifacts.require('Helper');

// eslint-disable-next-line func-names
module.exports = function (deployer) {
  deployer.deploy(GuildBankV2);
  // deployer.deploy(Helper);
};

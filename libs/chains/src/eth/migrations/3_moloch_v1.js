const GuildBankV1 = artifacts.require('GuildBank1');
const Token = artifacts.require('Token');

// eslint-disable-next-line func-names
module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Token, 10000);
  const token = await Token.deployed();

  const summoner = accounts[0];
  await deployer.deploy(GuildBankV1, summoner);
  // deployer.deploy(Helper);
};

const MolochV1 = artifacts.require('Moloch1');
const GuildBankV1 = artifacts.require('GuildBank1');
const Token = artifacts.require('Token');

// eslint-disable-next-line func-names
module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Token, 10000);
  const token = await Token.deployed();

  const summoner = accounts[0];
  const applicants = accounts.slice(5);

  await deployer.deploy(MolochV1,
    summoner,
    token.address, // approvedTokens:
    60, // _periodDuration:
    2, // _votingPeriodLength:
    2, // _gracePeriodLength:
    1, // _abortWindow:
    '3', // _proposalDeposit:
    3, // _diluationBound:
    '3', // _processingReward:
    // { gas: 25000 }
    // eslint-disable-next-line function-paren-newline
  );
  const moloch = await MolochV1.deployed();

  await deployer.deploy(GuildBankV1, summoner);
  // deployer.deploy(Helper);
};

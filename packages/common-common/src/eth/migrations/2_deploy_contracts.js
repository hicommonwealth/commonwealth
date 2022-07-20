const MolochV2 = artifacts.require('Moloch2');
const GuildBankV2 = artifacts.require('GuildBank2');
const HelperV2 = artifacts.require('Helper');

// eslint-disable-next-line func-names
module.exports = function (deployer) {
  deployer.deploy(MolochV2,
    '0xcE7aa2D3C1F8B572B50238230f5D55A78dB86087', // Summoner
    ['0xcE7aa2D3C1F8B572B50238230f5D55A78dB86087'], // approvedTokens
    17280, // _periodDuration
    35, // _votingPeriodLength
    35, // _gracePeriodLength
    70, // _abortWindow
    '10000000', // _proposalDeposit
    3, // _diluationBound
    '10000000', // _processingReward
    // { gas: 25000 }
    // eslint-disable-next-line function-paren-newline
  );
  deployer.deploy(GuildBankV2);
  // deployer.deploy(Helper);
};

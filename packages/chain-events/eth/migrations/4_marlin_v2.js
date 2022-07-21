const MPond = artifacts.require('MPond');
const GovernorAlpha = artifacts.require('GovernorAlpha');
const Timelock = artifacts.require('Timelock');

// eslint-disable-next-line func-names
module.exports = async function (deployer, network, accounts) {
  // Marlin Contracts
  // accounts[0] is initial mpondGuardian, admin of timelock, and guardian of GovernorAlpha
  const mpondGuardian = accounts[0]
  await  deployer.deploy(MPond, mpondGuardian, accounts[1]);
  const mpond = await MPond.deployed();
  await  deployer.deploy(Timelock, mpondGuardian, 172800); // 172800 is 2 days in seconds, which is the minimum delay for the contract
  const timelock = await Timelock.deployed();
  await deployer.deploy(GovernorAlpha, timelock.address, mpond.address, mpondGuardian);
  const governorAlpha = GovernorAlpha.deployed();
};
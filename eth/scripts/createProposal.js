/* eslint-disable */
module.exports = async function (callback) {
  let Web3 = require('web3');
  const truffleContract = require('truffle-contract')
  let Moloch1Contract = truffleContract(require('./build/contracts/Moloch1.json'));
  let TokenContract = truffleContract(require('./build/contracts/Token.json'));
  var provider = new Web3.providers.HttpProvider("http://localhost:9545");
  var web3 = new Web3(provider);
  Moloch1Contract.setProvider(web3.currentProvider);
  TokenContract.setProvider(web3.currentProvider);

  const summoner = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
  const applicant = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';
  try {
    const [ instance, tokenInstance ] = await Promise.all([ Moloch1Contract.deployed(), TokenContract.deployed() ])

    // create proposal
    await tokenInstance.transfer(applicant, 10, { from: summoner });
    await tokenInstance.approve(instance.address, 5, { from: summoner });
    await tokenInstance.approve(instance.address, 5, { from: applicant });
    await instance.submitProposal(applicant, 5, 5, 'hello', { from: summoner });
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}
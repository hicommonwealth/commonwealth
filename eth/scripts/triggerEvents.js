const truffleContract = require('truffle-contract');
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider('http://localhost:9545');
const web3 = new Web3(provider);

const Moloch1Contract = truffleContract(require('../build/contracts/Moloch1.json'));
Moloch1Contract.setProvider(provider);

const TokenContract = truffleContract(require('../build/contracts/Token.json'));
TokenContract.setProvider(web3.currentProvider);

const summoner = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const applicant = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';

async function submitProposal(moloch1, token) {
  await token.transfer(applicant, 10, { from: summoner });
  await token.approve(moloch1.address, 5, { from: summoner });
  await token.approve(moloch1.address, 5, { from: applicant });
  await moloch1.submitProposal(applicant, 5, 5, 'hello', { from: summoner });
  console.log('Proposal created!');
}

async function submitVote(moloch1, proposalIndex) {
  await moloch1.submitVote(proposalIndex, 1, { from: summoner });
  console.log('Vote submitted!');
}

async function processProposal(moloch1, proposalIndex) {
  await moloch1.processProposal(proposalIndex, { from: summoner });
  console.log('Proposal processed!');
}

async function abort(moloch1, proposalIndex) {
  await moloch1.abortProposal(proposalIndex, { from: applicant });
  console.log('Proposal aborted!');
}

async function ragequit(moloch1, sharesToBurn, who) {
  await moloch1.ragequit(sharesToBurn, { from: who });
  console.log('Ragequit!');
}

async function updateDelegateKey(moloch1, newKey, who) {
  await moloch1.updateDelegateKey(newKey, { from: who });
  console.log('Delegate key updated!');
}

// eslint-disable-next-line func-names
module.exports = async function (callback) {
  try {
    const [ moloch1, token ] = await Promise.all([ Moloch1Contract.deployed(), TokenContract.deployed() ]);
    await submitProposal(moloch1, token);
    await submitVote(moloch1, 0);
    console.log('Done!');
    callback();
  } catch (err) {
    callback(err);
  }
};

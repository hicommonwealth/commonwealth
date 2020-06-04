/* eslint-disable quotes */
const MolochV1 = artifacts.require("Moloch1");
const Token = artifacts.require("Token");

contract("SubmitProposalV1", async (accounts) => {
  it("should give account 0 one token", async () => {
    const instance = await MolochV1.deployed();
    const member = await instance.members(accounts[0]);
    // NOTE: the typegen is wrong here, what we receive is not an Array but an Object
    //   with numeric keys akin to an Array. So we destructure the result like an Object.
    const { 0: delegateKey, 1: shares, 2: exists } = member;
    assert.isTrue(exists);
    assert.equal(+shares, 1);
    assert.equal(delegateKey, accounts[0]);
  });

  it("should create a proposal for account 1", async () => {
    const instance = await MolochV1.deployed();
    const summoner = accounts[0];
    const applicant = accounts[1];
    const tokenInstance = await Token.deployed();

    // ensure summoner has tokens
    const summonerBalance = await tokenInstance.balanceOf(summoner);
    assert.isAtLeast(+summonerBalance, 20);

    // send some to applicant and ensure they receive it
    await tokenInstance.transfer(applicant, 10, { from: summoner });
    const applicantBalance = await tokenInstance.balanceOf(applicant);
    assert.isAtLeast(+applicantBalance, 5);

    // approve the transfer for both the summoner and applicant
    await tokenInstance.approve(instance.address, 5, { from: summoner });
    await tokenInstance.approve(instance.address, 5, { from: applicant });

    // submit the proposal
    await instance.submitProposal(applicant, 5, 5, 'hello');

    // guarantee the proposal exists
    const proposalQueueLength = await instance.getProposalQueueLength();
    assert.equal(+proposalQueueLength, 1);
    const proposal = await instance.proposalQueue(0);
    const { 0: proposer, 1: applicantAddr, 2: sharesRequested, 9: tokenTribute, 10: details } = proposal;
    assert.equal(proposer, summoner);
    assert.equal(applicantAddr, applicant);
    assert.equal(+sharesRequested, 5);
    assert.equal(+tokenTribute, 5);
    assert.equal(details, 'hello');
  });
});

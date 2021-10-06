import { ethers } from 'hardhat';
import '@nomiclabs/hardhat-ethers';

import {
  MPond__factory,
  GovernorBravoImmutable__factory,
} from '../types';

import {
  TimelockMock__factory,
} from '../types';
import { BigNumber } from '@ethersproject/bignumber';

async function main() {
  // Set up accounts
  const provider = ethers.provider;
  const addresses: string[] = await provider.listAccounts();
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);
  
  // Deploy timelock
  const timelockFactory = new TimelockMock__factory(signer);
  const timelock = await timelockFactory.deploy(member, 2 * 60);
  
  // Deploy comp
  const mpondFactory = new MPond__factory(signer);
  const comp = await mpondFactory.deploy(member, bridge);

  // Deploy Delegate
  const delegateFactory = new GovernorBravoImmutable__factory(signer);
  const bravo = await delegateFactory.deploy(
    timelock.address,
    comp.address,
    member,
    17280,
    1,
    '1'
  );
  await bravo.setInitialProposalId(); // needed?

  const from = member;

  // Do delegation
  const proposalMinimum = await bravo.proposalThreshold();
  const delegateAmount = proposalMinimum.mul(3);
  await comp.delegate(from, delegateAmount, { from });

  // Make the proposal
  const targets = ['0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'];
  const values = [BigNumber.from(0)];
  const signatures = ['_setCollateralFactor(address,uint256)'];
  const calldatas = [
    '0x000000000000000000000000C11B1268C1A384E55C48C2391D8D480264A3A7F40000000000000000000000000000000000000000000000000853A0D2313C0000',
  ];
  const description = 'test description';
  await bravo.propose(targets, values, signatures, calldatas, description, {
    from,
  });

  
  // Increase Time
  // Wait for proposal to activate (by mining blocks?)
  const activeProposals = await bravo.latestProposalIds(from);
  const { startBlock } = await bravo.proposals(activeProposals);
  const currentBlock = await provider.getBlockNumber();
  const blockDelta = startBlock.sub(currentBlock).add(1);
  const timeDelta = blockDelta.mul(15);
  await provider.send('evm_increaseTime', [+timeDelta]);
  for (let i = 0; i < +blockDelta; ++i) {
    await provider.send('evm_mine', []);
  }
  return;

  // // VoteCast Event
  // await bravo.castVoteWithReason(
  //   activeProposals,
  //   0,
  //   'i dont like it'
  // );
  
  try {
    await bravo.castVote(activeProposals, 1);
  }
  catch (e) {
    console.log(e);
  }

  return;

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

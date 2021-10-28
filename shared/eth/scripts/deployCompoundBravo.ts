import { providers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import Web3 from 'web3';

import {
  MPond__factory,
  TimelockMock__factory,
  GovernorBravoImmutable__factory,
} from '../types';

async function main() {
  // TODO: configure URL based on chain
  const web3Provider = new Web3.providers.WebsocketProvider('http://localhost:8545', {
    reconnect: {
      auto: true,
      delay: 5000,
      maxAttempts: 10,
      onTimeout: true,
    },
  });
  const provider = new providers.Web3Provider(web3Provider as any);
  // 12s minute polling interval (default is 4s)
  provider.pollingInterval = 12000;
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
    4, // 4 blocks voting period
    1, // 1 block voting delay
    1 // 1 vote proposal threshold
  );
  await bravo._initiate();
  console.log(bravo.address);
  return;

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

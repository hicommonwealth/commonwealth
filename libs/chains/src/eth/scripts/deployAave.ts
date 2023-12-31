import '@nomiclabs/hardhat-ethers';
import hre from 'hardhat';

import type { AaveTokenV2Mock as AaveTokenV2 } from '../types';
import {
  AaveGovernanceV2__factory as AaveGovernanceV2Factory,
  AaveTokenV2Mock__factory as AaveTokenV2Factory,
  Executor__factory as ExecutorFactory,
  GovernanceStrategy__factory as GovernanceStrategyFactory,
} from '../types';

async function increaseTime(blocks: number): Promise<void> {
  const timeToAdvance = blocks * 15;
  console.log(`Mining ${blocks} blocks and adding ${timeToAdvance} seconds!`);
  await hre.ethers.provider.send('evm_increaseTime', [timeToAdvance]);
  for (let i = 0; i < blocks; i++) {
    await hre.ethers.provider.send('evm_mine', []);
  }
}

async function initToken(
  token: AaveTokenV2,
  member: string,
  amount: string,
): Promise<void> {
  await token.mint(member, amount);
  await token.delegate(member);
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const member = signer.address;
  const TOTAL_SUPPLY = '1000000';

  // deploy and delegate tokens
  const tokenFactory = new AaveTokenV2Factory(signer);
  const token1 = await tokenFactory.deploy();
  const token2 = await tokenFactory.deploy();

  // deploy strategy
  const strategyFactory = new GovernanceStrategyFactory(signer);
  const strategy = await strategyFactory.deploy(token1.address, token2.address);

  // deploy AaveGovernance without executor, so we can pass as admin to executor constructor
  const govFactory = new AaveGovernanceV2Factory(signer);
  const governance = await govFactory.deploy(
    strategy.address,
    4, // 4 block voting delay
    member,
    [],
  );

  // deploy Executor
  const executorFactory = new ExecutorFactory(signer);
  const executor = await executorFactory.deploy(
    governance.address,
    60, // 1min delay
    60, // 1min grace period
    15, // 15s minimum delay
    120, // 2min maximum delay
    10, // 10% of supply required to submit
    12, // 12 blocks voting period
    10, // 10% differential required to pass
    20, // 20% quorum
  );

  // authorize executor on governance contract
  await governance.authorizeExecutors([executor.address]);

  // initialize tokens and test delegate events
  await initToken(token1, member, TOTAL_SUPPLY);
  await initToken(token2, member, TOTAL_SUPPLY);
  await increaseTime(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

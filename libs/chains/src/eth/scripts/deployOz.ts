import type { BigNumberish } from '@ethersproject/bignumber';
import type { Signer } from 'ethers';
import { providers } from 'ethers';

import type { ERC20VotesMock, TimelockController } from '../types';
import {
  ERC20VotesMock__factory as ERC20VotesMockFactory,
  GovernorMock__factory as GovernorMockFactory,
  TimelockController__factory as TimelockControllerFactory,
} from '../types';

async function deployErc20VotesMock(
  signer: Signer | providers.JsonRpcSigner,
  account: string,
  amount: number,
): Promise<ERC20VotesMock> {
  const factory = new ERC20VotesMockFactory(signer);
  const t = await factory.deploy('Test Token', 'TEST');
  await t.mint(account, amount);
  return t;
}

async function deployTimelock(
  signer: Signer | providers.JsonRpcSigner,
  minDelay: BigNumberish,
  proposers: string[],
  executors: string[],
): Promise<TimelockController> {
  const factory = new TimelockControllerFactory(signer);
  return factory.deploy(minDelay, proposers, executors);
}

async function main() {
  // TODO: configure URL based on chain
  const Web3 = (await import('web3')).default;
  const web3Provider = new Web3.providers.WebsocketProvider(
    'http://localhost:8545',
    {
      reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 10,
        onTimeout: true,
      },
    },
  );
  const provider = new providers.Web3Provider(web3Provider as any);
  // 12s minute polling interval (default is 4s)
  provider.pollingInterval = 12000;
  const addresses: string[] = await provider.listAccounts();
  const [member] = addresses;
  const signer = provider.getSigner(member);

  // deploy voting token and mint 100 tokens
  const token = await deployErc20VotesMock(signer, member, 100);

  // deploy timelock
  const timelock = await deployTimelock(signer, 2 * 60, [member], [member]); // 2 min minutes delay

  // deploy governor
  const factory = new GovernorMockFactory(signer);
  const governor = await factory.deploy(
    'Test Governor',
    token.address,
    2, // 2 blocks delay until vote starts
    16, // vote goes for 16 blocks
    timelock.address,
    5, // 5% of token supply must vote to pass = 5 tokens,
    0, // 0 votes required for a voter to become a proposer
  );

  // ensure governor can make calls on timelock by granting roles
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, governor.address);
  await timelock.grantRole(EXECUTOR_ROLE, governor.address);
  console.log(governor.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

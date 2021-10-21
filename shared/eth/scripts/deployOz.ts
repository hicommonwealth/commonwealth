import { ethers } from 'hardhat';
import '@nomiclabs/hardhat-ethers';

import {
  GovernorMock__factory as GovernorMockFactory,
  ERC20VotesMock,
  ERC20VotesMock__factory as ERC20VotesMockFactory,
} from '../types';

import { providers, Signer } from 'ethers';

async function deployErc20VotesMock(
  signer: Signer | providers.JsonRpcSigner,
  account: string,
  amount: number
): Promise<ERC20VotesMock> {
  const factory = new ERC20VotesMockFactory(signer);
  const t = await factory.deploy('Test Token', 'TEST');
  await t.mint(account, amount);
  return t;
}

async function main() {
   // eslint-disable-next-line prefer-destructuring
   const provider = ethers.provider;
   const addresses: string[] = await provider.listAccounts();
   const [member] = addresses;
   const signer = provider.getSigner(member);
 
   // deploy voting token and mint 100 tokens
   const token = await deployErc20VotesMock(signer, member, 100);
 
   // deploy governor
   const factory = new GovernorMockFactory(signer);
   const governor = await factory.deploy(
     'Test Governor',
     token.address,
     2, // 2 blocks delay until vote starts
     16, // vote goes for 16 blocks
     5 // 5% of token supply must vote to pass = 5 tokens
   );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

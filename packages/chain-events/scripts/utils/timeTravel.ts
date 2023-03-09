import { BigNumber, providers } from 'ethers';

export async function timeTravel(
  provider: providers.JsonRpcProvider,
  numBlocks: number
) {
  const numBlocksBN = BigNumber.from(numBlocks);
  console.log(`\tTime travelling through ${numBlocks} blocks!`);
  const timeDelta = numBlocksBN.mul(15);
  await provider.send('evm_increaseTime', [+timeDelta]);
  for (let i = 0; i < +numBlocksBN; ++i) {
    await provider.send('evm_mine', []);
  }
  console.log(`\tWelcome to the future!\n`);
}

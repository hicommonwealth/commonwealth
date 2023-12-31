import { providers } from 'ethers';

async function increaseTime(
  provider: providers.Web3Provider,
  blocks: number,
): Promise<void> {
  const timeToAdvance = blocks * 15;
  console.log(`Mining ${blocks} blocks and adding ${timeToAdvance} seconds!`);
  await provider.send('evm_increaseTime', [timeToAdvance]);
  for (let i = 0; i < blocks; i++) {
    await provider.send('evm_mine', []);
  }
}

async function main(argv: string[]) {
  const Web3 = (await import('web3')).default;
  const web3Provider = new Web3.providers.WebsocketProvider(
    'ws://localhost:8545',
  );
  const provider = new providers.Web3Provider(web3Provider as any);
  const nBlocks = argv[0] ? +argv[0] : 1;
  await increaseTime(provider, nBlocks);
  const block = await provider.getBlock('latest');
  console.log(
    `Current block number ${block.number} with timestamp ${block.timestamp}.`,
  );
}

main(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { config } from '@hicommonwealth/model';
import { Anvil, createAnvil, CreateAnvilOptions } from '@viem/anvil';
import Web3 from 'web3';
import getProvider from './getProvider';

export async function advanceTime(seconds: number, blocks = 1) {
  const provider = new Web3.providers.HttpProvider(
    config.TEST_EVM.PROVIDER_URL,
  );

  const web3 = getProvider();
  let block = await web3.eth.getBlock('latest');

  const preTime = block.timestamp.toString();
  const advance_secs = Web3.utils.numberToHex(seconds).toString();
  const res = await provider.request({
    jsonrpc: '2.0',
    id: 1,
    method: 'evm_increaseTime',
    params: [advance_secs],
  });

  if (res.error) {
    throw new Error((res.error as { code: number; message: string }).message);
  }

  await mineBlocks(blocks);
  block = await web3.eth.getBlock('latest');
  const postTime = block.timestamp.toString();
  return {
    preTime,
    postTime,
  };
}

export async function mineBlocks(blocks: number) {
  const provider = new Web3.providers.HttpProvider(
    config.TEST_EVM.PROVIDER_URL,
  );

  // mine blocks
  const res = await provider.request({
    jsonrpc: '2.0',
    id: 1,
    method: 'anvil_mine',
    params: [blocks],
  });

  if (res.error) {
    throw new Error((res.error as { code: number; message: string }).message);
  }

  return true;
}

export async function getAnvil(
  forkEthChainId: 84532 | 1,
  options: CreateAnvilOptions = {},
): Promise<Anvil> {
  const anvil = createAnvil({
    forkUrl:
      forkEthChainId === 84532
        ? `https://base-sepolia.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PRIVATE}`
        : `https://eth-mainnet.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PRIVATE}`,
    silent: false,
    port: 8545,
    autoImpersonate: true,
    startTimeout: 10_000,
    stopTimeout: 10_000,
    ...options,
  });
  await anvil.start();
  return anvil;
}

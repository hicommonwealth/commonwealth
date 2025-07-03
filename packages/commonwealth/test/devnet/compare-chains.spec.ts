import { factoryContracts, ValidChains } from '@hicommonwealth/evm-protocols';
import { describe, expect, test } from 'vitest';

type ContractMap = Record<string, string>;

async function getCode(rpcUrl: string, address: string): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getCode',
      params: [address, 'latest'],
      id: 1,
    }),
  });

  const json = await response.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

async function compareContractBytecodes(
  name: string,
  rpcA: string,
  rpcB: string,
  contracts: ContractMap,
) {
  const contractEntries = Object.entries(contracts).filter(
    ([, address]) =>
      typeof address === 'string' &&
      address.startsWith('0x') &&
      address.length === 42,
  );

  for (const [label, address] of contractEntries) {
    const [codeA, codeB] = await Promise.all([
      getCode(rpcA, address),
      getCode(rpcB, address),
    ]);

    console.log(`🔍 Comparing [${name}] ${label}: ${address}`);
    expect(codeA).toBe(codeB);
  }
}

describe('Anvil fork vs Base Sepolia contract code', () => {
  test('SepoliaBase contracts match', async () => {
    await compareContractBytecodes(
      'SepoliaBase',
      'https://anvil-basesepolia.railway.internal',
      'https://sepolia.base.org',
      factoryContracts[ValidChains.SepoliaBase],
    );
  });

  test('Base Mainnet contracts match', async () => {
    await compareContractBytecodes(
      'Base',
      'https://anvil-base-anvil.up.railway.app',
      'https://mainnet.base.org',
      factoryContracts[ValidChains.Base],
    );
  });
});

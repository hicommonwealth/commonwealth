import * as Abis from '@commonxyz/common-protocol-abis';
import { dispose, logger } from '@hicommonwealth/core';
import type { Abi, AbiEvent } from 'viem';
import { toEventSelector } from 'viem';

const log = logger(import.meta);

function generateEventSignatureBlock(contractName: string, abi: Abi): string {
  const events = abi.filter(
    (entry): entry is AbiEvent => entry.type === 'event',
  );

  const lines = [`${contractName}: {`];
  for (const event of events) {
    const selector = toEventSelector(event);
    lines.push(`  ${event.name}: '${selector}',`);
  }
  lines.push('},');
  return lines.join('\n');
}

async function main() {
  const contractName = process.argv[2];

  if (!contractName) {
    log.error('Usage: pnpm ts-exec generate-event-signature.ts <ContractName>');
    return;
  }

  const abi = Abis[contractName];

  if (!abi || !Array.isArray(abi)) {
    log.error(`ABI not found for contract: ${contractName}`);
    return;
  }

  const block = generateEventSignatureBlock(contractName, abi);
  console.log(block);
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}

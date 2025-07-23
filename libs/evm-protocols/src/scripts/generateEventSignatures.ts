import * as abis from '@commonxyz/common-protocol-abis';
import fs from 'fs';
import path from 'path';
import { toEventHash } from 'viem';
import pkg from '../../../../package.json';

const version = pkg.dependencies['@commonxyz/common-protocol-abis'];

function generateEventSignatureMap() {
  const lines: string[] = [];

  lines.push(`// This file is auto-generated. Do not modify manually.`);
  lines.push('');
  lines.push(`export const commonProtocolAbiVersion = '${version}';`);
  lines.push('');
  lines.push(`export const EvmEventSignatures = {`);

  for (const [abiName, rawAbi] of Object.entries(abis)) {
    if (abiName === 'default') continue;

    const contract = rawAbi;
    const cleanName = abiName.replace(/Abi$/, '');

    for (const item of contract) {
      if (item.type !== 'event' || !item.name) continue;

      const key = `${cleanName}.${item.name}`;
      const hash = toEventHash(item); // viem computes the keccak256 event hash

      lines.push(`  ${JSON.stringify(key)}: '${hash}',`);
    }
  }

  lines.push(`} as const;`);
  lines.push('');
  lines.push(`export type evmEventSignatures = typeof evmEventSignatures;`);

  const output = lines.join('\n');

  const outPath = path.resolve(
    path.dirname(import.meta.url.slice(7)),
    '../evmEventSignatures.ts',
  );

  fs.writeFileSync(outPath, output);
  console.log('✅ Generated evmEventSignatures.ts');
}

generateEventSignatureMap();

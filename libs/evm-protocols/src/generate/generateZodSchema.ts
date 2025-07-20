import * as abis from '@commonxyz/common-protocol-abis';
import fs from 'fs';
import path from 'path';
import pkg from '../../../../package.json';

export function solidityToZodStr(type: string): string {
  if (type.startsWith('uint') || type.startsWith('int')) {
    return 'z.bigint()'; // maps all integer types
  }
  if (type === 'address') {
    return 'z.string().regex(/^0x[0-9a-fA-F]{40}$/)';
  }
  if (type === 'string') {
    return 'z.string()';
  }
  if (type === 'bool') {
    return 'z.boolean()';
  }
  if (type.startsWith('bytes')) {
    return 'z.string()'; // treat as hex strings
  }
  if (type.endsWith('[]')) {
    // e.g. uint256[] → array of bigints
    const inner = type.slice(0, -2);
    return `z.array(${solidityToZodStr(inner)})`;
  }
  if (type.match(/^[a-z]+\[\d+\]$/)) {
    // Fixed-size array, e.g. uint256[3]
    const [inner] = type.split('[');
    return `z.array(${solidityToZodStr(inner)})`;
  }

  throw new Error(`Can't map solidity type: ${type} to zod. Fix`);
}

const version = pkg.dependencies['@commonxyz/common-protocol-abis'];

function generateZodMap() {
  const lines: string[] = [];
  lines.push(
    `// This is autogenereated, do not modify manually. To modify run 'pnpm generate-event-schema'`,
    ``,
  );
  lines.push(`import { z } from 'zod';`, ``);
  lines.push(`export const commonProtocolVersion = '${version}';`, ``);
  lines.push(
    `const ChainEventBase = z.object({
    ethChainId: z.number(),
    block_number: z.string(),
    block_timestamp: z.string(),
    contract_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    transaction_hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/)
  });`,
    ``,
  );

  lines.push(`export const commonProtocolEventSchema = {`);

  for (const [abiName, rawAbi] of Object.entries(abis)) {
    if (abiName === 'default') continue;
    const contract = rawAbi;
    const cleanName = abiName.replace(/Abi$/, '');

    for (const item of contract) {
      if (item.type !== 'event' || !item.name) continue;
      const key = `${cleanName}.${item.name}`;
      const props = (item.inputs || [])
        .map(
          (inp) =>
            `      ${JSON.stringify(inp.name)}: ${solidityToZodStr(inp.type)}`,
        )
        .join(',\n');

      lines.push(`  ${JSON.stringify(key)}: ChainEventBase.extend({`);
      lines.push(`    args: z.object({`);
      lines.push(props);
      lines.push(`    })`);
      lines.push(`  }),`);
    }
  }

  lines.push(`} as const;`, '');
  lines.push(
    `export type CommonProtocolEventSchemaKey = keyof typeof commonProtocolEventSchema;`,
  );
  const output = lines.join('\n');
  const outPath = path.resolve(
    path.dirname(import.meta.url.slice(7)),
    './commonProtocolEventSchema.ts',
  );
  fs.writeFileSync(outPath, output);
  console.log('✅ Generated commonProtocolEventSchema.ts');
}

generateZodMap();

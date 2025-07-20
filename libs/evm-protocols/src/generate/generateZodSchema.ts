import * as abis from '@commonxyz/common-protocol-abis';
import fs from 'fs';
import path from 'path';
import pkg from '../../../../package.json';

export function solidityToZodStr(type: string): string {
  if (type.startsWith('uint') || type.startsWith('int')) {
    return 'z.coerce.bigint()'; // maps all integer types
  }
  if (type === 'address') {
    return 'EVM_ADDRESS_STRICT';
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
  lines.push(
    'const EVM_ADDRESS_STRICT_REGEX = /^0x[0-9a-fA-F]{40}$/;',
    'const EVM_EVENT_SIGNATURE_STRICT_REGEX = /^0x[0-9a-fA-F]{64}$/;',
    'export const EVM_ADDRESS_STRICT = z.custom<`0x${string}`>((val) =>',
    '  EVM_ADDRESS_STRICT_REGEX.test(val as string),',
    ');',
    'export const EVM_EVENT_SIGNATURE_STRICT = z.custom<`0x${string}`>((val) =>',
    '  EVM_EVENT_SIGNATURE_STRICT_REGEX.test(val as string),',
    ');',
    '',
  );
  lines.push(`export const commonProtocolVersion = '${version}';`, ``);
  lines.push(
    `export const ChainEventBase = z.object({
    eth_chain_id: z.number(),
    block_number: z.string(),
    block_timestamp: z.number(),
    contract_address: EVM_ADDRESS_STRICT,
    transaction_hash: EVM_EVENT_SIGNATURE_STRICT
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
      lines.push(`    parsedArgs: z.object({`);
      lines.push(props);
      lines.push(`    })`);
      lines.push(`  }),`);
    }
  }

  lines.push(`} as const;`, '');
  lines.push(
    `
type CommonProtocolEventSchema = typeof commonProtocolEventSchema;
type InferEventPayload<T extends keyof CommonProtocolEventSchema> = z.infer<CommonProtocolEventSchema[T]>;
export type CommonProtocolEventHandlerType = {
  [K in keyof CommonProtocolEventSchema]?: (args: {
    id: string;
    name: K;
    payload: InferEventPayload<K>;
  }) => void | Promise<void>;
};`,
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

import * as abis from '@commonxyz/common-protocol-abis';
import { z, ZodTypeAny } from 'zod';

function solidityToZod(type: string): ZodTypeAny {
  if (type.startsWith('uint') || type.startsWith('int')) {
    return z.bigint(); // maps all integer types
  }
  if (type === 'address') {
    return z.string().regex(/^0x[0-9a-fA-F]{40}$/);
  }
  if (type === 'string') {
    return z.string();
  }
  if (type === 'bool') {
    return z.boolean();
  }
  if (type.startsWith('bytes')) {
    return z.string(); // treat as hex strings
  }
  if (type.endsWith('[]')) {
    // e.g. uint256[] → array of bigints
    const inner = type.slice(0, -2);
    return z.array(solidityToZod(inner));
  }
  if (type.match(/^[a-z]+\[\d+\]$/)) {
    // Fixed-size array, e.g. uint256[3]
    const [inner] = type.split('[');
    return z.array(solidityToZod(inner));
  }

  throw new Error(`Can't map solidity type: ${type} to zod. Fix`);
}

// Generate a Map of schemas per event
export const schemaMap = (() => {
  const m = new Map<string, z.ZodSchema<any>>();

  for (const [abiName, abi] of Object.entries(abis)) {
    for (const item of abi) {
      if (item.type !== 'event' || !item.name) continue;
      const parsedName = abiName.replace(/Abi$/, '');
      const key = `${parsedName}.${item.name}`;
      const shape: Record<string, ZodTypeAny> = {};
      for (const inp of item.inputs ?? []) {
        shape[inp.name] = solidityToZod(inp.type);
      }
      m.set(key, z.object(shape));
    }
  }

  return m;
})();

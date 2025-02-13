import { AbiEvent } from 'viem';

function solidityTypeToZodString(solidityType: string): string {
  // Handle array types (e.g. "uint256[]")
  if (solidityType.endsWith('[]')) {
    const baseType = solidityType.slice(0, -2);
    return `z.array(${solidityTypeToZodString(baseType)})`;
  }

  // Map based on explicit instructions
  switch (solidityType) {
    case 'address':
    case 'bytes':
      return 'z.literal(`0x${z.string()}`)';
    case 'string':
      return 'z.string()';
    case 'uint256':
      return 'z.bigint()';
    case 'bool':
      return 'z.boolean()';
    default: {
      // Additional numeric types (e.g. int128, uint8, etc.) are handled as bigint
      if (/^(u?int)(\d+)?$/.test(solidityType)) {
        return 'z.bigint()';
      }
      // Fixed-size bytes (e.g. bytes32)
      if (/^bytes\d+$/.test(solidityType)) {
        return 'z.literal(`0x${z.string()}`)';
      }
      throw new Error(`Unsupported Solidity type: ${solidityType}`);
    }
  }
}

export function abiEventToZodSchemaString(event: AbiEvent): string {
  let schemaString = `${event.name}: z.object({\n`;

  event.inputs.forEach((input, index) => {
    const line = `  ${input.name}: ${solidityTypeToZodString(input.type)}`;
    schemaString += line;
    if (index < event.inputs.length - 1) {
      schemaString += ',\n';
    }
  });

  schemaString += '\n})';
  return schemaString;
}

function main() {
  const event = {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'namespace',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'recipientAmount',
        type: 'uint256',
      },
    ],
    name: 'FeesDistributed',
    type: 'event',
  } as const;
  console.log(abiEventToZodSchemaString(event));
}

main();

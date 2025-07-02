import { describe, expect, test } from 'vitest';
import {
  parseAbiItemsFromABI,
  parseEventFromABI,
  parseEventsFromABI,
  parseFunctionFromABI,
  parseFunctionsFromABI,
  parseWriteFunctionsFromABI,
} from '../../../shared/abi_utils';

describe('parseAbiItemsFromABI() unit tests', () => {
  test('should properly parse abi items from abi', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
      },
    ];
    const abiItems = parseAbiItemsFromABI(abi);
    expect(abiItems.length).toBe(3);
    expect(abiItems[0].name).toBe('deposit');
    expect(abiItems[0].type).toBe('function');
    // @ts-expect-error StrictNullChecks
    expect(abiItems[0].inputs.length).toBe(2);
    // @ts-expect-error StrictNullChecks
    expect(abiItems[0].inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiItems[0].inputs[0].name).toBe('token');
    // @ts-expect-error StrictNullChecks
    expect(abiItems[0].inputs[0].type).toBe('address');
    expect(abiItems[1].name).toBe('withdraw');
    expect(abiItems[1].type).toBe('function');
    // @ts-expect-error StrictNullChecks
    expect(abiItems[1].inputs.length).toBe(2);
    // @ts-expect-error StrictNullChecks
    expect(abiItems[1].inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiItems[1].inputs[0].name).toBe('token');
  });
});
describe('parseFunctionsFromABI() unit tests', () => {
  test('should properly parse abi functions from abi', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
      },
    ];
    const abiFunctions = parseFunctionsFromABI(abi);
    expect(abiFunctions.length).toBe(2);
    expect(abiFunctions[0].name).toBe('deposit');
    expect(abiFunctions[0].type).toBe('function');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs.length).toBe(2);
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs[0].name).toBe('token');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs[0].type).toBe('address');
    expect(abiFunctions[1].name).toBe('withdraw');
    expect(abiFunctions[1].type).toBe('function');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[1].inputs.length).toBe(2);
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[1].inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[1].inputs[0].name).toBe('token');
  });
  test('should return empty array if no functions in abi', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
      },
    ];
    const abiFunctions = parseFunctionsFromABI(abi);
    expect(abiFunctions.length).toBe(0);
  });
});

describe('parseWriteFunctionsFromABI() unit tests', () => {
  test('should properly parse abi functions from abi', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
    ];
    const abiFunctions = parseWriteFunctionsFromABI(abi);
    expect(abiFunctions.length).toBe(1);
    expect(abiFunctions[0].name).toBe('deposit');
    expect(abiFunctions[0].type).toBe('function');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs.length).toBe(2);
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs[0].name).toBe('token');
    // @ts-expect-error StrictNullChecks
    expect(abiFunctions[0].inputs[0].type).toBe('address');
  });
  test('should return empty array if no write functions', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
    ];
    const abiFunctions = parseWriteFunctionsFromABI(abi);
    expect(abiFunctions.length).toBe(0);
  });
});
describe('parseFunctionFromABI() unit tests', () => {
  test('should properly parse withdraw functions from abi', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];
    const abiFunction = parseFunctionFromABI(abi, 'withdraw');
    expect(abiFunction.name).toBe('withdraw');
    expect(abiFunction.type).toBe('function');
    // @ts-expect-error StrictNullChecks
    expect(abiFunction.inputs.length).toBe(2);
    // @ts-expect-error StrictNullChecks
    expect(abiFunction.inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiFunction.inputs[0].name).toBe('token');
    // @ts-expect-error StrictNullChecks
    expect(abiFunction.inputs[0].type).toBe('address');
  });
  test('should throw error if function not found', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
    ];
    expect(() => parseFunctionFromABI(abi, 'withdraw')).toThrow(
      'Could not find function withdraw in ABI',
    );
  });
});

describe('parseEventsFromABI() unit tests', () => {
  test('should properly parse abi events from abi', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
    ];
    const abiEvents = parseEventsFromABI(abi);
    expect(abiEvents.length).toBe(1);
    expect(abiEvents[0].name).toBe('withdraw');
    expect(abiEvents[0].type).toBe('event');
    // @ts-expect-error StrictNullChecks
    expect(abiEvents[0].inputs.length).toBe(1);
    // @ts-expect-error StrictNullChecks
    expect(abiEvents[0].inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiEvents[0].inputs[0].name).toBe('token');
    // @ts-expect-error StrictNullChecks
    expect(abiEvents[0].inputs[0].type).toBe('address');
  });
  test('should return empty array if no events are found', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'function',
      },
    ];
    const abiEvents = parseEventsFromABI(abi);
    expect(abiEvents.length).toBe(0);
  });
});

describe('parseEventFromABI() unit tests', () => {
  test('should properly parse withdraw event from abi', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'event',
      },
    ];
    const abiEvent = parseEventFromABI(abi, 'deposit');
    expect(abiEvent.name).toBe('deposit');
    expect(abiEvent.type).toBe('event');
    // @ts-expect-error StrictNullChecks
    expect(abiEvent.inputs.length).toBe(2);
    // @ts-expect-error StrictNullChecks
    expect(abiEvent.inputs[0].internalType).toBe('address');
    // @ts-expect-error StrictNullChecks
    expect(abiEvent.inputs[0].name).toBe('token');
    // @ts-expect-error StrictNullChecks
    expect(abiEvent.inputs[0].type).toBe('address');
  });

  test('should throw error if event not found', () => {
    const abi = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'constant',
        type: 'event',
      },
    ];
    expect(() => parseEventFromABI(abi, 'deposit')).toThrow();
  });
});

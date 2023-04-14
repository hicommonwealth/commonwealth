import { expect } from 'chai';
import {
  parseAbiItemsFromABI,
  parseEventFromABI,
  parseEventsFromABI,
  parseFunctionFromABI,
  parseFunctionsFromABI,
  parseWriteFunctionsFromABI,
} from '../../../shared/abi_utils';

describe('parseAbiItemsFromABI() unit tests', () => {
  it('should properly parse abi items from abi', () => {
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
    expect(abiItems.length).to.equal(3);
    expect(abiItems[0].name).to.equal('deposit');
    expect(abiItems[0].type).to.equal('function');
    expect(abiItems[0].inputs.length).to.equal(2);
    expect(abiItems[0].inputs[0].internalType).to.equal('address');
    expect(abiItems[0].inputs[0].name).to.equal('token');
    expect(abiItems[0].inputs[0].type).to.equal('address');
    expect(abiItems[1].name).to.equal('withdraw');
    expect(abiItems[1].type).to.equal('function');
    expect(abiItems[1].inputs.length).to.equal(2);
    expect(abiItems[1].inputs[0].internalType).to.equal('address');
    expect(abiItems[1].inputs[0].name).to.equal('token');
  });
});
describe('parseFunctionsFromABI() unit tests', () => {
  it('should properly parse abi functions from abi', () => {
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
    expect(abiFunctions.length).to.equal(2);
    expect(abiFunctions[0].name).to.equal('deposit');
    expect(abiFunctions[0].type).to.equal('function');
    expect(abiFunctions[0].inputs.length).to.equal(2);
    expect(abiFunctions[0].inputs[0].internalType).to.equal('address');
    expect(abiFunctions[0].inputs[0].name).to.equal('token');
    expect(abiFunctions[0].inputs[0].type).to.equal('address');
    expect(abiFunctions[1].name).to.equal('withdraw');
    expect(abiFunctions[1].type).to.equal('function');
    expect(abiFunctions[1].inputs.length).to.equal(2);
    expect(abiFunctions[1].inputs[0].internalType).to.equal('address');
    expect(abiFunctions[1].inputs[0].name).to.equal('token');
  });
  it('should return empty array if no functions in abi', () => {
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
    expect(abiFunctions.length).to.equal(0);
  });
});

describe('parseWriteFunctionsFromABI() unit tests', () => {
  it('should properly parse abi functions from abi', () => {
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
    expect(abiFunctions.length).to.equal(1);
    expect(abiFunctions[0].name).to.equal('deposit');
    expect(abiFunctions[0].type).to.equal('function');
    expect(abiFunctions[0].inputs.length).to.equal(2);
    expect(abiFunctions[0].inputs[0].internalType).to.equal('address');
    expect(abiFunctions[0].inputs[0].name).to.equal('token');
    expect(abiFunctions[0].inputs[0].type).to.equal('address');
  });
  it('should return empty array if no write functions', () => {
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
    expect(abiFunctions.length).to.equal(0);
  });
});
describe('parseFunctionFromABI() unit tests', () => {
  it('should properly parse withdraw functions from abi', () => {
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
    expect(abiFunction.name).to.equal('withdraw');
    expect(abiFunction.type).to.equal('function');
    expect(abiFunction.inputs.length).to.equal(2);
    expect(abiFunction.inputs[0].internalType).to.equal('address');
    expect(abiFunction.inputs[0].name).to.equal('token');
    expect(abiFunction.inputs[0].type).to.equal('address');
  });
  it('should throw error if function not found', () => {
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
    expect(() => parseFunctionFromABI(abi, 'withdraw')).to.throw(
      'Could not find function withdraw in ABI'
    );
  });
});

describe('parseEventsFromABI() unit tests', () => {
  it('should properly parse abi events from abi', () => {
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
    expect(abiEvents.length).to.equal(1);
    expect(abiEvents[0].name).to.equal('withdraw');
    expect(abiEvents[0].type).to.equal('event');
    expect(abiEvents[0].inputs.length).to.equal(1);
    expect(abiEvents[0].inputs[0].internalType).to.equal('address');
    expect(abiEvents[0].inputs[0].name).to.equal('token');
    expect(abiEvents[0].inputs[0].type).to.equal('address');
  });
  it('should return empty array if no events are found', () => {
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
    expect(abiEvents.length).to.equal(0);
  });
});

describe('parseEventFromABI() unit tests', () => {
  it('should properly parse withdraw event from abi', () => {
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
    expect(abiEvent.name).to.equal('deposit');
    expect(abiEvent.type).to.equal('event');
    expect(abiEvent.inputs.length).to.equal(2);
    expect(abiEvent.inputs[0].internalType).to.equal('address');
    expect(abiEvent.inputs[0].name).to.equal('token');
    expect(abiEvent.inputs[0].type).to.equal('address');
  });

  it('should throw error if event not found', () => {
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
    expect(() => parseEventFromABI(abi, 'deposit')).to.throw();
  });
});

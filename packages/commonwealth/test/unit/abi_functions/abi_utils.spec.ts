import { assert, expect } from 'chai';
import { parseAbiItemsFromABI } from 'client/scripts/helpers/abi_utils';
import { BigNumber, ethers } from 'ethers';

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

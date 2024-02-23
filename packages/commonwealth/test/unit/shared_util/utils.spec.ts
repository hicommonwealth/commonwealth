import { expect } from 'chai';
import {
  bech32ToHex,
  minimalToNaturalDenom,
  naturalDenomToMinimal,
} from '../../../shared/utils';

describe('shared utils unit tests', () => {
  it('minimalToNaturalDenom() should convert large numbers in minimal format to natural denom format', () => {
    const tests = [
      {
        input: '123456789012345678901234567890',
        decimals: 18,
        expected: '123456789012.345678901234567890',
      },
      {
        input: '1000000000000000000000',
        decimals: 18,
        expected: '1000.000000000000000000',
      },
      {
        input: '100000000000000000000',
        decimals: 18,
        expected: '100.000000000000000000',
      },
      {
        input: '10000000000000000000',
        decimals: 18,
        expected: '10.000000000000000000',
      },
      {
        input: '1000000000000000000',
        decimals: 18,
        expected: '1.000000000000000000',
      },
      {
        input: '100000000000000000',
        decimals: 18,
        expected: '0.100000000000000000',
      },
      {
        input: '10000000000000000',
        decimals: 18,
        expected: '0.010000000000000000',
      },
      {
        input: '123456789012345678901234567890',
        decimals: 6,
        expected: '123456789012345678901234.567890',
      },
      {
        input: '12345678901234567890123456789012345',
        decimals: 6,
        expected: '12345678901234567890123456789.012345',
      },
      {
        input: '12345678901234567890123456789012345.99999', // exceeding precision
        decimals: 6,
        expected: '12345678901234567890123456789.012345', // does not round up
      },
      { input: '1000000000', decimals: 6, expected: '1000.000000' },
      { input: '100000000', decimals: 6, expected: '100.000000' },
      { input: '10000000', decimals: 6, expected: '10.000000' },
      { input: '1000000', decimals: 6, expected: '1.000000' },
      { input: '100000', decimals: 6, expected: '0.100000' },
      { input: '10000', decimals: 6, expected: '0.010000' },
      { input: undefined, decimals: 6, expected: '0' },
      { input: '1000000', decimals: undefined, expected: '0' },
      { input: '', decimals: 12, expected: '0' },
      { input: '1000000', decimals: 0, expected: '0' },
      { input: 1000000, decimals: 5, expected: '10.00000' },
    ];

    tests.forEach(({ input, decimals, expected }) => {
      expect(minimalToNaturalDenom(input, decimals)).to.equal(expected);
    });
  });
  it('naturalDenomToMinimal() should convert large numbers in natural format to minimal denom format', () => {
    const tests = [
      {
        input: '123456789012.345678901234567890',
        decimals: 18,
        expected: '123456789012345678901234567890',
      },
      {
        input: '1000',
        decimals: 18,
        expected: '1000000000000000000000',
      },
      {
        input: '100',
        decimals: 18,
        expected: '100000000000000000000',
      },
      { input: '10', decimals: 18, expected: '10000000000000000000' },
      { input: '1', decimals: 18, expected: '1000000000000000000' },
      { input: '0.1', decimals: 18, expected: '100000000000000000' },
      {
        input: '0.010000000000000009',
        decimals: 18,
        expected: '10000000000000009',
      },
      {
        input: '123456789012345678901234.567890',
        decimals: 6,
        expected: '123456789012345678901234567890',
      },
      {
        input: '123456789012345678901234.56789912345', // exceeding precision
        decimals: 6,
        expected: '123456789012345678901234567899', // does not round up
      },
      { input: '1000', decimals: 6, expected: '1000000000' },
      { input: '100.000000', decimals: 6, expected: '100000000' },
      { input: '10.000000', decimals: 6, expected: '10000000' },
      { input: '1.000001', decimals: 6, expected: '1000001' },
      { input: '0.100002', decimals: 6, expected: '100002' },
      { input: '0.010003', decimals: 6, expected: '10003' },
      { input: undefined, decimals: 6, expected: '0' },
      { input: '1000000', decimals: undefined, expected: '0' },
      { input: '', decimals: 12, expected: '0' },
      { input: '1000000', decimals: 0, expected: '0' },
      { input: 1000000, decimals: 5, expected: '100000000000' },
    ];
    tests.forEach(({ input, decimals, expected }) => {
      expect(naturalDenomToMinimal(input, decimals)).to.equal(expected);
    });
  });
  it('bech32toHex should convert bech32 addresses to hex', async () => {
    const address = 'osmo1g98znshl3dh49x402fj3tdwjj5ysf9f0akl8zf';
    const expectedHex = '414e29c2ff8b6f529aaf526515b5d2950904952f';
    const hex = await bech32ToHex(address);
    expect(hex).to.equal(expectedHex);
  });
  it('bech32toHex should create same hex for sibling chain addresses', async () => {
    const address1 = 'osmo1g98znshl3dh49x402fj3tdwjj5ysf9f0akl8zf';
    const address2 = 'juno1g98znshl3dh49x402fj3tdwjj5ysf9f0rl0vn8';
    const expectedHex = '414e29c2ff8b6f529aaf526515b5d2950904952f';
    const hex1 = await bech32ToHex(address1);
    const hex2 = await bech32ToHex(address2);
    expect(hex1).to.equal(expectedHex);
    expect(hex2).to.equal(hex1);
  });
  it(`bech32toHex should create same hex for sibling ethermint chain addresses, 
    but different from regular cosmos hex`, async () => {
    const ethermintAddress1 = 'evmos1f5hr3wk6vkd5lqvd70tqzrqp6w3qwgvd7nyd65';
    const ethermintAddress2 = 'inj1f5hr3wk6vkd5lqvd70tqzrqp6w3qwgvdkmz8jy';
    const expectedEthermintHex = '4d2e38bada659b4f818df3d6010c01d3a207218d';
    const cosmosAddress = 'osmo1g98znshl3dh49x402fj3tdwjj5ysf9f0akl8zf';
    const expectedCosmosHex = '414e29c2ff8b6f529aaf526515b5d2950904952f';
    const cosmosHex = await bech32ToHex(cosmosAddress);
    const hex1 = await bech32ToHex(ethermintAddress1);
    const hex2 = await bech32ToHex(ethermintAddress2);
    expect(hex1).to.equal(expectedEthermintHex);
    expect(hex2).to.equal(hex1);
    expect(cosmosHex).to.equal(expectedCosmosHex);
    expect(cosmosHex).to.not.equal(hex1);
  });
});

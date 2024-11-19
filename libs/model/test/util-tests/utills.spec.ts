import { bech32ToHex } from '@hicommonwealth/shared';

import { describe, expect, test } from 'vitest';

describe('shared utils unit tests', () => {
  test('bech32toHex should convert bech32 addresses to hex', async () => {
    const address = 'osmo1g98znshl3dh49x402fj3tdwjj5ysf9f0akl8zf';
    const expectedHex = '414e29c2ff8b6f529aaf526515b5d2950904952f';
    const hex = await bech32ToHex(address);
    expect(hex).to.equal(expectedHex);
  });
  test('bech32toHex should create same hex for sibling chain addresses', async () => {
    const address1 = 'osmo1g98znshl3dh49x402fj3tdwjj5ysf9f0akl8zf';
    const address2 = 'juno1g98znshl3dh49x402fj3tdwjj5ysf9f0rl0vn8';
    const expectedHex = '414e29c2ff8b6f529aaf526515b5d2950904952f';
    const hex1 = await bech32ToHex(address1);
    const hex2 = await bech32ToHex(address2);
    expect(hex1).to.equal(expectedHex);
    expect(hex2).to.equal(hex1);
  });
  test(`bech32toHex should create same hex for sibling ethermint chain addresses, 
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

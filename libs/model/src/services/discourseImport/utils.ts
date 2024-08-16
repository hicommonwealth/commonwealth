import bip39 from 'bip39';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-line
import cosmos from 'cosmos-lib'; // TODO: add lib types?

export const createCosmosAddress = () => {
  const MNEMONIC = bip39.generateMnemonic();
  const keys = cosmos.crypto.getKeysFromMnemonic(MNEMONIC);
  return cosmos.address.getAddress(keys.publicKey);
};

// Copyright (c) 2022 ECO Stake
import { encodeSecp256k1Signature } from '@cosmjs/amino';
import { makeSignBytes } from '@cosmjs/proto-signing';
import { ETH } from '@tharsis/address-converter';
import { bech32 } from 'bech32';
import { concat, keccak256, parseSignature, toBytes } from 'viem';

function EthSigner(signer, ethSigner, prefix) {
  async function signDirect(_address, signDoc) {
    const signature = await ethSigner
      ._signingKey()
      .signDigest(keccak256(makeSignBytes(signDoc)));
    const { r, s } = parseSignature(signature);
    const result = toBytes(concat([r, s]));
    const pubkey = (await getAccounts())[0].pubkey;
    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(pubkey, result),
    };
  }

  async function getAddress() {
    const ethereumAddress = await ethSigner.getAddress();
    const data = ETH.decoder(ethereumAddress);
    return bech32.encode(prefix, bech32.toWords(data));
  }

  function getAccounts() {
    return signer.getAccounts();
  }

  return {
    signer,
    ethSigner,
    signDirect,
    getAddress,
    getAccounts,
  };
}

export default EthSigner;

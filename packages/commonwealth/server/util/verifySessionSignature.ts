import { configure as configureStableStringify } from 'safe-stable-stringify';
import type { KeyringOptions } from '@polkadot/keyring/types';
import { hexToU8a, stringToHex } from '@polkadot/util';
import type { KeypairType } from '@polkadot/util-crypto/types';
import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import { bech32 } from 'bech32';
import bs58 from 'bs58';
import Web3 from 'web3';
import { factory, formatFilename } from 'common-common/src/logging';
import { ChainBase, WalletId } from 'common-common/src/types';

import { addressSwapper } from '../../shared/utils';
import { getCosmosSessionSignatureData } from '../../shared/adapters/chain/cosmos/keys';
import { constructTypedCanvasMessage } from '../../shared/adapters/chain/ethereum/keys';
import {
  chainBaseToCanvasChain,
  chainBaseToCanvasChainId,
  createCanvasSessionPayload,
} from '../../shared/canvas';
import type { AddressInstance } from '../models/address';
import type { ChainInstance } from '../models/chain';

const log = factory.getLogger(formatFilename(__filename));

// can't import from canvas es module, so we reimplement stringify here
const sortedStringify = configureStableStringify({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

const verifySessionSignature = async (
  chain: Readonly<ChainInstance>,
  chain_id: string | number,
  addressInstance: Readonly<AddressInstance>,
  signatureString: string,
  sessionAddress: string | null, // used when signing a block to login
  sessionIssued: string | null, // used when signing a block to login
  sessionBlockInfo: string | null // used when signing a block to login
): Promise<boolean> => {
  if (!chain) {
    log.error('no chain provided to verifySignature');
    return false;
  }

  // Reconstruct the expected canvas message.
  const canvasChain = chainBaseToCanvasChain(chain.base);
  const canvasChainId = chainBaseToCanvasChainId(chain.base, chain_id);
  const canvasSessionPayload = createCanvasSessionPayload(
    canvasChain,
    canvasChainId,
    chain.base === ChainBase.Substrate
      ? addressSwapper({
          address: addressInstance.address,
          currentPrefix: 42,
        })
      : addressInstance.address,
    sessionAddress,
    parseInt(sessionIssued, 10),
    sessionBlockInfo
      ? addressInstance.block_info
        ? JSON.parse(addressInstance.block_info).hash
        : null
      : null
  );

  let isValid: boolean;
  if (chain.base === ChainBase.Substrate) {
    //
    // substrate address handling
    //
    const polkadot = await import('@polkadot/keyring');
    const address = polkadot.decodeAddress(addressInstance.address);
    const keyringOptions: KeyringOptions = { type: 'sr25519' };
    if (
      !addressInstance.keytype ||
      addressInstance.keytype === 'sr25519' ||
      addressInstance.keytype === 'ed25519'
    ) {
      if (addressInstance.keytype) {
        keyringOptions.type = addressInstance.keytype as KeypairType;
      }
      keyringOptions.ss58Format = chain.ss58_prefix ?? 42;
      const signerKeyring = new polkadot.Keyring(keyringOptions).addFromAddress(
        address
      );
      const message = stringToHex(sortedStringify(canvasSessionPayload));

      const signatureU8a =
        signatureString.slice(0, 2) === '0x'
          ? hexToU8a(signatureString)
          : hexToU8a(`0x${signatureString}`);
      isValid = signerKeyring.verify(message, signatureU8a, address);
    } else {
      log.error('Invalid keytype.');
      isValid = false;
    }
  } else if (
    chain.base === ChainBase.CosmosSDK &&
    (addressInstance.wallet_id === WalletId.CosmosEvmMetamask ||
      addressInstance.wallet_id === WalletId.KeplrEthereum)
  ) {
    //
    // ethereum address handling on cosmos chains via metamask
    //
    const web3 = new Web3();
    const address = web3.eth.accounts.recover(
      sortedStringify(canvasSessionPayload),
      signatureString.trim()
    );

    try {
      const b32Address = bech32.encode(
        chain.bech32_prefix,
        bech32.toWords(Buffer.from(address.slice(2), 'hex'))
      );
      if (addressInstance.address === b32Address) isValid = true;
    } catch (e) {
      isValid = false;
    }
  } else if (
    chain.base === ChainBase.CosmosSDK &&
    chain.bech32_prefix === 'terra'
  ) {
    //
    // cosmos-sdk address handling
    //

    // provided string should be serialized AminoSignResponse object
    const stdSignature = JSON.parse(signatureString);

    // we generate an address from the actual public key and verify that it matches,
    // this prevents people from using a different key to sign the message than
    // the account they registered with.
    // TODO: ensure ion works
    const bech32Prefix = chain.bech32_prefix;

    const cosmCrypto = await import('@cosmjs/crypto');
    if (!bech32Prefix) {
      log.error('No bech32 prefix found.');
      isValid = false;
    } else {
      const cosm = await import('@cosmjs/amino');
      const generatedAddress = cosm.pubkeyToAddress(
        stdSignature.pub_key,
        bech32Prefix
      );

      if (generatedAddress === addressInstance.address) {
        try {
          // directly verify the generated signature, generated via SignBytes
          const { pubkey, signature } = cosm.decodeSignature(stdSignature);
          const secpSignature =
            cosmCrypto.Secp256k1Signature.fromFixedLength(signature);
          const messageHash = new cosmCrypto.Sha256(
            Buffer.from(sortedStringify(canvasSessionPayload))
          ).digest();

          isValid = await cosmCrypto.Secp256k1.verifySignature(
            secpSignature,
            messageHash,
            pubkey
          );
        } catch (e) {
          isValid = false;
        }
      }
    }
  } else if (chain.base === ChainBase.CosmosSDK) {
    //
    // cosmos-sdk address handling
    //
    const stdSignature = JSON.parse(signatureString);

    const bech32Prefix = chain.bech32_prefix;
    if (!bech32Prefix) {
      log.error('No bech32 prefix found.');
      isValid = false;
    } else {
      const cosm = await import('@cosmjs/amino');
      const generatedAddress = cosm.pubkeyToAddress(
        stdSignature.pub_key,
        bech32Prefix
      );
      const generatedAddressWithCosmosPrefix = cosm.pubkeyToAddress(
        stdSignature.pub_key,
        'cosmos'
      );

      if (
        generatedAddress === addressInstance.address ||
        generatedAddressWithCosmosPrefix === addressInstance.address
      ) {
        try {
          // Generate sign doc from token and verify it against the signature
          const generatedSignDoc = await getCosmosSessionSignatureData(
            Buffer.from(sortedStringify(canvasSessionPayload)),
            generatedAddress
          );

          const { pubkey, signature } = cosm.decodeSignature(stdSignature);
          const cosmCrypto = await import('@cosmjs/crypto');
          const secpSignature =
            cosmCrypto.Secp256k1Signature.fromFixedLength(signature);
          const messageHash = new cosmCrypto.Sha256(
            cosm.serializeSignDoc(generatedSignDoc)
          ).digest();
          isValid = await cosmCrypto.Secp256k1.verifySignature(
            secpSignature,
            messageHash,
            pubkey
          );
          if (!isValid) {
            log.error('Signature mismatch.');
          }
        } catch (e) {
          log.error(`Signature verification failed: ${e.message}`);
          isValid = false;
        }
      } else {
        log.error(
          `Address not matched. Generated ${generatedAddress}, found ${addressInstance.address}.`
        );
        isValid = false;
      }
    }
  } else if (chain.base === ChainBase.Ethereum) {
    //
    // ethereum address handling
    //
    try {
      const typedCanvasMessage = constructTypedCanvasMessage(canvasSessionPayload);

      if (addressInstance.block_info !== sessionBlockInfo) {
        throw new Error(
          `Eth verification failed for ${addressInstance.address}: signed a different block than expected`
        );
      }
      const address = recoverTypedSignature({
        data: typedCanvasMessage,
        signature: signatureString.trim(),
        version: SignTypedDataVersion.V4,
      });
      isValid = addressInstance.address.toLowerCase() === address.toLowerCase();
      if (!isValid) {
        log.info(
          `Eth verification failed for ${addressInstance.address}: does not match recovered address ${address}`
        );
      }
    } catch (e) {
      log.info(
        `Eth verification failed for ${addressInstance.address}: ${e.stack}`
      );
      isValid = false;
    }
  } else if (chain.base === ChainBase.NEAR) {
    //
    // near address handling
    //

    // both in base64 encoding
    const nacl = await import('tweetnacl');
    const { signature: sigObj, publicKey } = JSON.parse(signatureString);

    isValid = nacl.sign.detached.verify(
      Buffer.from(sortedStringify(canvasSessionPayload)),
      Buffer.from(sigObj, 'base64'),
      Buffer.from(publicKey, 'base64')
    );
  } else if (chain.base === ChainBase.Solana) {
    //
    // solana address handling
    //

    // ensure address is base58 string length 32, cf @solana/web3 impl
    try {
      const decodedAddress = bs58.decode(addressInstance.address);
      if (decodedAddress.length === 32) {
        const nacl = await import('tweetnacl');
        isValid = nacl.sign.detached.verify(
          Buffer.from(sortedStringify(canvasSessionPayload)),
          bs58.decode(signatureString),
          decodedAddress
        );
      } else {
        isValid = false;
      }
    } catch (e) {
      isValid = false;
    }
  } else {
    // invalid network
    log.error(`invalid network: ${chain.network}`);
    isValid = false;
  }

  return isValid;
};

export default verifySessionSignature;

// Cosmos cannot sign arbitrary blobs, but they can sign transactions. So, as a hack around that,
// we insert our account registration token into a proposal message, and then verify against the
// generated signature. But first we need the message to insert.
import { AminoMsg, makeSignDoc, StdSignDoc, StdFee } from '@cosmjs/amino';
import type { Block, SessionPayload } from '@canvas-js/interfaces';
import { toBase64 } from '@cosmjs/encoding';
export const validationTokenToSignDoc = (
  token: Uint8Array,
  address: string
): StdSignDoc => {
  const accountNumber = 0;
  const sequence = 0;
  const chainId = '';
  const fee: StdFee = {
    gas: '0',
    amount: [],
  };
  const memo = '';

  const jsonTx: AminoMsg = {
    type: 'sign/MsgSignData',
    value: {
      signer: address,
      data: toBase64(token),
    },
  };
  const signDoc = makeSignDoc(
    [jsonTx],
    fee,
    chainId,
    memo,
    accountNumber,
    sequence
  );
  return signDoc;
};

export const constructTypedMessage = async (fromAddress: string, fromChainId: number, sessionPublicAddress: string, validationBlockInfoString: string) => {
  const placeholderMultihash = '/commonwealth'; // TODO

  const validationBlockInfo = JSON.parse(validationBlockInfoString)
  const block: Block = {
    chain: 'cosmos',
    chainId: fromChainId,
    blocknum: validationBlockInfo.number,
    blockhash: validationBlockInfo.hash,
    timestamp: validationBlockInfo.timestamp,
  };

  // use the block timestamp as the message timestamp, since the block should
  // have been requested recently
  const payload: SessionPayload = {
    from: fromAddress,
    spec: placeholderMultihash,
    address: sessionPublicAddress,
    duration: 86400 * 1000,
    timestamp: block.timestamp,
    block,
  };

  const message = {
    loginTo: payload.spec,
    registerSessionAddress: payload.address,
    registerSessionDuration: payload.duration.toString(),
    timestamp: payload.timestamp.toString(),
  };

  // what goes here?
  // do we need to use TypedDataDomain and TypedDataField?
  // a lot of this stuff seems like it could be shared between the different chains, but i don't know what

  // canvas uses ethers' signTypedData types while commonwealth uses eth-sig-util's
  // so we have to coerce the types here
  return { types, primaryType: 'Message', domain, message } as any;
}

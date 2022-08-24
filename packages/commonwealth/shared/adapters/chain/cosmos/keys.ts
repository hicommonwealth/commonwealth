// Cosmos cannot sign arbitrary blobs, but they can sign transactions. So, as a hack around that,
// we insert our account registration token into a proposal message, and then verify against the
// generated signature. But first we need the message to insert.
import { AminoMsg, makeSignDoc, StdSignDoc, StdFee } from '@cosmjs/amino';
import { toBase64 } from '@cosmjs/encoding';
export const validationTokenToSignDoc = (
  token: Uint8Array,
  address: string
): StdSignDoc => {
  // type: "sign/MsgSignData",
  // value: {
  //   signer: signerAddress,
  //   data: toBase64(d),
  // },

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

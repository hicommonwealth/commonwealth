// Cosmos cannot sign arbitrary blobs, but they can sign transactions. So, as a hack around that,
// we insert our account registration token into a proposal message, and then verify against the
// generated signature. But first we need the message to insert.

export const validationTokenToSignDoc = async (address: string, token: string) => {
  const CosmosApi = await import('@lunie/cosmos-api');
  const cosmos = new CosmosApi.default('');
  const jsonTx = (cosmos as any).MsgSubmitProposal(address, {
    proposalType: 'cosmos-sdk/TextProposal',
    title: token.trim(),
    description: '',
    initialDeposits: [{ denom: 'stake', amount: '0' }]
  }).message;
  const stdTx = CosmosApi.createStdTx({
    gas: '100000',
    gasPrices: [{ denom: 'stake', amount: '0' }],
    memo: ''
  }, jsonTx);
  delete stdTx.fee;
  delete stdTx.memo;

  const signDoc = {
    chain_id: 'straightedge-2',
    account_number: '0',
    sequence: '0',
    fee: { gas: '100000', amount: [{ denom: 'astr', amount: '2500000000000000' }] },
    memo: '',
    msgs: stdTx.msg,
  };
  return signDoc;
};

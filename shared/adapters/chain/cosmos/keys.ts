// Cosmos cannot sign arbitrary blobs, but they can sign transactions. So, as a hack around that,
// we insert our account registration token into a proposal message, and then verify against the
// generated signature. But first we need the message to insert.
export const VALIDATION_CHAIN_DATA = {
  sequence: '0', accountNumber: '0', chainId: 'validation'
};

export const keyToMsgSend = async (address: string, token: string) => {
  const CosmosApi = await import('@lunie/cosmos-api');
  const cosmos = new CosmosApi.default('');
  const jsonTx = (cosmos as any).MsgSubmitProposal(address, {
    proposalType: 'cosmos-sdk/TextProposal',
    title: token.trim(),
    description: '',
    initialDeposits: [{ denom: 'stake', amount: '0'}]
  }).message;
  const stdTx = CosmosApi.createStdTx({ gas: '0', gasPrices: [{ denom: 'stake', amount: '0' }], memo: ''}, jsonTx);
  return stdTx;
};

export const keyToSignMsg = async (address: string, token: string) => {
  const stdTx = await keyToMsgSend(address, token);
  // TODO: swap out this chain ID either for a constant or something that can be retrieved on the server
  return (await import('@lunie/cosmos-api')).createSignMessage(stdTx, VALIDATION_CHAIN_DATA);
};

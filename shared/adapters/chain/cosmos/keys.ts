// Cosmos cannot sign arbitrary blobs, but they can sign transactions. So, as a hack around that,
// we insert our account registration token into a proposal message, and then verify against the
// generated signature. But first we need the message to insert.

export const validationTokenToSignDoc = async (address: string, token: string) => {
  const CosmosApi = await import('@cosmjs/launchpad');
  const msg = {
    type: 'cosmos-sdk/MsgSubmitProposal',
    value: {
      content: {
        proposalType: 'cosmos-sdk/TextProposal',
        title: token.trim(),
        description: '',
      },
      initial_deposit: [{ denom: 'stake', amount: '0' }],
      proposer: address,
    }
  };

  const signDoc = CosmosApi.makeSignDoc(
    [ msg ],
    { gas: '100000', amount: [{ denom: 'astr', amount: '2500000000000000' }] },
    'straightedge-2',
    '',
    '0',
    '0',
  );
  return signDoc;
};

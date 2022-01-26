import type { TypedMessage, MessageTypes } from '@metamask/eth-sig-util';

interface ServerTokenMessage extends MessageTypes {
  ServerToken: [
    { name: 'serverToken', type: 'string' }
  ]
}

export const constructTypedMessage = (chainId: number, token: string): TypedMessage<ServerTokenMessage> => {
  const typedMessage: TypedMessage<ServerTokenMessage> = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
      ServerToken: [
        { name: 'serverToken', type: 'string' }
      ]
    },
    primaryType: 'ServerToken',
    domain: {
      name: 'Commonwealth',
      version: '1',
      chainId,
    },
    message: { serverToken: token },
  };
  return typedMessage;
}

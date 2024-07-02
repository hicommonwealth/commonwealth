import { EthExecutionAPI, HttpProvider, Web3, WebSocketProvider } from 'web3';

export function getWeb3Instance(chainNodeUrl: string) {
  const headers = {
    Origin: window.location.hostname,
  };

  const provider:
    | HttpProvider<EthExecutionAPI>
    | WebSocketProvider<EthExecutionAPI> =
    chainNodeUrl.slice(0, 4) == 'http'
      ? new HttpProvider(chainNodeUrl, {
          providerOptions: { headers },
        })
      : new WebSocketProvider(chainNodeUrl, { headers });

  return new Web3(provider);
}

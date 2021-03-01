export function constructSubstrateUrl(url: string): string {
  const secureNodes = [
    'edgewa.re',
    'kusama-rpc.polkadot.io',
    'rpc.polkadot.io',
    'rpc.plasmnet.io',
    'scan-rpc.stafi.io',
    'rpc.kulupu.corepaper.org',
    'cc1.darwinia.network',
    'fullnode.centrifuge.io',
    'poc3.phala.network',
  ];
  const hasProtocol = url.indexOf('wss://') !== -1 || url.indexOf('ws://') !== -1;
  url = hasProtocol ? url.split('://')[1] : url;
  const isInsecureProtocol = !secureNodes.find((path) => url.indexOf(path) !== -1);
  const protocol = isInsecureProtocol ? 'ws://' : 'wss://';
  if (url.indexOf(':9944') !== -1) {
    url = isInsecureProtocol ? url : url.split(':9944')[0];
  }
  url = protocol + url;
  return url;
}

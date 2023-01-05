export function constructSubstrateUrl(url: string): string {
  const insecureNodes = ['localhost', '127.0.0.1'];
  const hasProtocol =
    url.indexOf('wss://') !== -1 || url.indexOf('ws://') !== -1;
  url = hasProtocol ? url.split('://')[1] : url;
  const insecureNodeSubstring = insecureNodes.find(
    (path) => url.indexOf(path) !== -1
  );
  const isInsecureProtocol = !!insecureNodeSubstring;
  const protocol = isInsecureProtocol ? 'ws://' : 'wss://';
  if (url.indexOf(':9944') !== -1) {
    // always override the port in secure protocols
    url = isInsecureProtocol ? url : url.split(':9944')[0];
  }
  url = protocol + url;
  return url;
}

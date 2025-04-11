import NodeInfo from 'client/scripts/models/NodeInfo';

export const formatJsonRpcMap = (nodes?: NodeInfo[]) => {
  if (!nodes) {
    return;
  }

  return nodes.reduce(
    (acc, node) => {
      if (node.ethChainId && node.url) {
        const urls = node.url.split(',').map((url) => url.trim());
        acc[node.ethChainId] = urls;
      }
      return acc;
    },
    {} as { [chainId: number]: string[] },
  );
};

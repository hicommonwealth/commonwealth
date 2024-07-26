import NodeInfo from 'models/NodeInfo';

export const getNodeByUrl = (url: string, nodes?: NodeInfo[]) => {
  if (!url || !nodes) {
    return undefined;
  }

  // replace the 'https://' with '' as a variant
  const urlVariants = [
    url,
    url.replace(/\/$/, ''),
    url.replace(/^(https?:\/\/|wss?:\/\/)/, ''),
    url.replace(/^(https?:\/\/|wss?:\/\/)/, '').replace(/\/$/, ''),
  ];

  return nodes.find((node) => urlVariants.includes(node.url));
};

export const getNodeByCosmosChainId = (
  cosmosChainId: string,
  nodes?: NodeInfo[],
) => {
  if (!cosmosChainId || !nodes) {
    return undefined;
  }

  return nodes.find((node) => cosmosChainId === node.cosmosChainId);
};

export const getNodeById = (id: number, nodes?: NodeInfo[]) => {
  if (!id || !nodes) {
    return undefined;
  }

  return nodes.find((node) => id === node.id);
};

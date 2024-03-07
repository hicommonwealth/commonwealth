import type NodeInfo from '../models/NodeInfo';
import IdStore from './IdStore';

class NodeStore extends IdStore<NodeInfo> {
  public getByUrl(url: string) {
    if (!url) return undefined;
    // replace the 'https://' with '' as a variant
    const urlVariants = [
      url,
      url.replace(/\/$/, ''),
      url.replace(/^(https?:\/\/|wss?:\/\/)/, ''),
      url.replace(/^(https?:\/\/|wss?:\/\/)/, '').replace(/\/$/, ''),
    ];

    return this._store.find((node) => urlVariants.includes(node.url));
  }

  public getByCosmosChainId(cosmosChainId: string) {
    if (!cosmosChainId) return undefined;

    return this._store.find((node) => cosmosChainId === node.cosmosChainId);
  }
}

export default NodeStore;

import IdStore from './IdStore';
import { NodeInfo } from '../models';

class NodeStore extends IdStore<NodeInfo> {
    public getNodesByChainId(eth_chain_id: number): NodeInfo {
        // filter through the _storeId map for a contract with a specified nickname
        const nodes = this.getAll().filter((c) => c.ethChainId === eth_chain_id);
        if (nodes.length > 0) {
            return nodes[0];
        } else {
            console.log("No nodes found with ethChainId ", eth_chain_id);
            return null;
        }
    }
}

export default NodeStore;

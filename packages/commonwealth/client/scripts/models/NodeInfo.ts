import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';

class NodeInfo {
  public readonly id: number;
  public readonly name: string;
  public readonly url: string;
  public readonly ethChainId?: number;
  public readonly cosmosChainId?: string;
  public readonly altWalletUrl?: string;
  public readonly balanceType?: string;
  public readonly bech32?: string;
  public readonly cosmosGovernanceVersion?: string;
  public readonly block_explorer?: string;
  public readonly slip44?: number;
  public readonly alchemyMetadata?: object;

  constructor({
    id,
    name,
    url,
    eth_chain_id,
    cosmos_chain_id,
    alt_wallet_url,
    balance_type,
    bech32,
    cosmos_gov_version,
    block_explorer,
    slip44,
    alchemy_metadata,
  }: Omit<z.infer<typeof schemas.ChainNode>, 'created_at' | 'updated_at'>) {
    this.id = id!;
    this.name = name;
    this.url = url;
    this.ethChainId = eth_chain_id || undefined;
    this.cosmosChainId = cosmos_chain_id || undefined;
    this.altWalletUrl = alt_wallet_url || undefined;
    this.balanceType = balance_type;
    this.bech32 = bech32 || undefined;
    this.cosmosGovernanceVersion = cosmos_gov_version || undefined;
    this.block_explorer = block_explorer || undefined;
    this.slip44 = slip44 || undefined;
    this.alchemyMetadata = alchemy_metadata || undefined;
  }

  public static fromJSON(json) {
    return new NodeInfo(json);
  }
}

export default NodeInfo;

import { ChainNetwork } from './types';
import OffchainTag from './OffchainTag';

class ChainInfo {
  public readonly id: string;
  public readonly symbol: string;
  public readonly name: string;
  public readonly network: ChainNetwork;
  public readonly iconUrl: string;
  public readonly description: string;
  public readonly tags: OffchainTag[];
  public readonly chainObjectId: string;

  constructor(id, network, symbol, name, iconUrl, description, tags?, chainObjectVersion?) {
    this.id = id;
    this.network = network;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.tags = tags || [];
    this.chainObjectId = chainObjectVersion && chainObjectVersion.id;
  }
  public static fromJSON(json) {
    return new ChainInfo(
      json.id,
      json.network,
      json.symbol,
      json.name,
      json.icon_url,
      json.description,
      json.tags,
      json.ChainObjectVersion
    );
  }
}

export default ChainInfo;

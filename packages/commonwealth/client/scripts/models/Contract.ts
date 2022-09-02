import moment from 'moment';


class Contract {
  public readonly id: number;
  public readonly address: string;
  public readonly chainNodeId: number;
  public readonly type: string;
  public readonly createdAt: moment.Moment;
  public readonly updatedAt: moment.Moment;

  public readonly decimals?: number;
  public readonly token_name?: string;
  public readonly symbol?: string;
  public readonly abi?: string;

  constructor(id, address, chainNodeId, type, createdAt, updatedAt, decimals?, token_name?, symbol?, abi?) {
    this.id = id;
    this.address = address;
    this.chainNodeId = chainNodeId;
    this.type = type;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.decimals = decimals;
    this.token_name = token_name;
    this.symbol = symbol;
    this.abi = abi;
  }

  public static fromJSON(json) {
    return new Contract(json.id, json.address, json.chainNodeId, json.type, json.createdAt, json.updatedAt, json.decimals, json.token_name, json.symbol, json.abi.abi);
  }
}

export default Contract;


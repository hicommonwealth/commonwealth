import moment from 'moment';


class Contract {
  public readonly id: number;
  public readonly address: string;
  public readonly chainNodeId: number;
  public readonly type: string;
  public readonly createdAt: moment.Moment;
  public readonly updatedAt: moment.Moment;

  public readonly decimals?: number;
  public readonly tokenName?: string;
  public readonly symbol?: string;
  public readonly abi?: string;

  constructor(id, address, chainNodeId, type, createdAt, updatedAt, decimals?, tokenName?, symbol?, contractAbi?) {
    this.id = id;
    this.address = address;
    this.chainNodeId = chainNodeId;
    this.type = type;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.decimals = decimals;
    this.tokenName = tokenName;
    this.symbol = symbol;
    this.abi = contractAbi;
  }

  public static fromJSON({
    id,
    address,
    chain_node_id,
    type,
    created_at,
    updated_at,
    decimals,
    token_name,
    symbol,
    contract_abi
  }) {
    return new Contract(id,
      address,
      chain_node_id,
      type,
      created_at,
      updated_at,
      decimals,
      token_name,
      symbol,
      contract_abi);
  }
}

export default Contract;


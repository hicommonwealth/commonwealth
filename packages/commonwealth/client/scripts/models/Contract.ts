import type moment from 'moment';
import type ContractAbi from './ContractAbi';

class Contract {
  public readonly id: number;
  public readonly address: string;
  public readonly chainNodeId: number;
  public readonly type: string;
  public readonly createdAt?: moment.Moment;
  public readonly updatedAt?: moment.Moment;

  public readonly decimals?: number;
  public readonly tokenName?: string;
  public readonly symbol?: string;
  public readonly isFactory?: boolean;
  public readonly nickname?: string;
  public readonly abi?: Array<Record<string, unknown>>;

  public readonly contractAbi?: ContractAbi;

  public readonly ethChainId?: number;
  // Not attached to db model, but used for UI
  public readonly ccts?: Array<{
    id: number;
    communityContractId: number;
    templateId: number;

    cctmd: {
      id: number;
      slug: string;
      nickname: string;
      display_name: string;
      display_options: string;
    };
  }>;

  constructor({
    id,
    address,
    chainNodeId,
    type,
    createdAt,
    updatedAt,
    decimals,
    tokenName,
    symbol,
    abi,
    isFactory,
    nickname,
    contractAbi,
    ethChainId,
    ccts,
  }: {
    id: number;
    address: string;
    chainNodeId: number;
    type: string;
    createdAt?: moment.Moment;
    updatedAt?: moment.Moment;
    decimals?: number;
    tokenName?: string;
    symbol?: string;
    abi?: Array<Record<string, unknown>>;
    isFactory?: boolean;
    nickname?: string;
    contractAbi?: ContractAbi;
    ethChainId?: number;
    ccts?: Array<{
      id: number;
      communityContractId: number;
      templateId: number;

      cctmd: {
        id: number;
        slug: string;
        nickname: string;
        display_name: string;
        display_options: string;
      };
    }>;
  }) {
    this.id = id;
    this.address = address;
    this.chainNodeId = chainNodeId;
    this.type = type;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.decimals = decimals;
    this.tokenName = tokenName;
    this.symbol = symbol;
    this.abi = abi;
    this.isFactory = isFactory;
    this.nickname = nickname;
    this.contractAbi = contractAbi;
    this.ethChainId = ethChainId;
    this.ccts = ccts;
  }

  public static fromJSON({
    id,
    address,
    chain_node_id,
    type,
    createdAt,
    updatedAt,
    decimals,
    tokenName,
    symbol,
    abi,
    isFactory,
    nickname,
    contractAbi,
    ethChainId,
    ccts,
  }) {
    return new Contract({
      id,
      address,
      chainNodeId: chain_node_id,
      type,
      createdAt,
      updatedAt,
      decimals,
      tokenName,
      symbol,
      abi,
      isFactory,
      nickname,
      contractAbi,
      ethChainId,
      ccts,
    });
  }
}

export default Contract;

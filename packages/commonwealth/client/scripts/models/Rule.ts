import ChainInfo from './ChainInfo';

class Rule {
  public readonly id: number;
  public readonly chainId: string;
  public readonly rule: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly chain: ChainInfo;

  public constructor({
    id,
    chainId,
    rule,
    createdAt,
    updatedAt,
    chain,
  }: {
    id: number;
    chainId: string;
    rule: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    chain: ChainInfo;
  }) {
    this.id = id;
    this.chainId = chainId;
    this.rule = rule;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.chain = chain;
  }
}

export default Rule;

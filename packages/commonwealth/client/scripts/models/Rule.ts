class Rule {
  public readonly id: number;
  public readonly chainId: string;
  public readonly rule: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor({
    id,
    chainId,
    rule,
    createdAt,
    updatedAt,
  }: {
    id: number;
    chainId: string;
    rule: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = id;
    this.chainId = chainId;
    this.rule = rule;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default Rule;

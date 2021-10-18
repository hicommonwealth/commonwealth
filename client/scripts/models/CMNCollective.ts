export class CMNCollective {
  public readonly address: string;
  public readonly name: string;
  public readonly description: string;

  public totalFunding: number;

  public acceptedTokens: any[];
  public nominations: Array<string>;
  public withdrawIsDone: boolean;
  public cTokens: any; // cTokens address
  public bTokens: any; // bTokens address
  public updated_at: Date;

  constructor(name, description, address, totalFunding) {
    this.description = description;
    this.name = name;
    this.address = address;
    this.totalFunding = totalFunding;
  }

  public set(acceptedTokens, bTokens, cTokens, lockedWithdraw) {
    this.acceptedTokens = acceptedTokens;
    this.bTokens = bTokens;
    this.cTokens = cTokens;
    this.withdrawIsDone = lockedWithdraw;
    this.updated_at = new Date();
  }
}

export class CMNCollectiveProtocol {
  public readonly id: string;
  public collectives: CMNCollective[];
  public updated_at: Date;
  public feeTo: string;
  public acceptedTokens: any[];

  constructor(id, feeTo, collectives, acceptedTokens) {
    this.feeTo = feeTo;
    this.id = id;
    this.collectives = collectives;
    this.acceptedTokens = acceptedTokens;
    this.updated_at = new Date();
  }

  public static fromJSON({ id, feeTo, collectives, acceptedTokens }) {
    return new CMNCollectiveProtocol(id, feeTo, collectives, acceptedTokens);
  }

  public set(protocolFee, feeTo, collectives, acceptedTokens) {
    this.feeTo = feeTo;
    this.collectives = collectives;
    this.acceptedTokens = acceptedTokens;
    this.updated_at = new Date();
  }
}

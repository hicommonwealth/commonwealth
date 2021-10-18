import BN from 'bn.js';

type ProjectStatus = 'In Progress' | 'Successed' | 'Failed';

export class CMNProject {
  public readonly cwUrl: string;
  public readonly curatorFee: number;
  public readonly ipfsHash: string;
  public readonly name: string;
  public readonly description: string;
  public readonly threshold: number;
  public readonly endTime: Date;
  public readonly address: string;
  public readonly beneficiary: string;

  public status: ProjectStatus;
  public totalFunding: number;

  public acceptedTokens: any[];
  public nominations: Array<string>;
  public withdrawIsDone: boolean;
  public cTokens: any; // cTokens address
  public bTokens: any; // bTokens address
  public updated_at: Date;

  constructor(
    name,
    description,
    ipfsHash,
    threshold,
    endTime,
    projAddress,
    beneficiary,
    cwUrl,
    curatorFee,
    status,
    totalFunding,
    nominations
  ) {
    this.name = name;
    this.description = description;
    this.ipfsHash = ipfsHash;
    this.threshold = threshold;
    this.endTime = endTime;
    this.status = status;
    this.totalFunding = totalFunding;
    this.address = projAddress;
    this.beneficiary = beneficiary;
    this.curatorFee = curatorFee;
    this.cwUrl = cwUrl;
    this.nominations = nominations;
  }

  public set(acceptedTokens, bTokens, cTokens, lockedWithdraw) {
    this.acceptedTokens = acceptedTokens;
    this.bTokens = bTokens;
    this.cTokens = cTokens;
    this.withdrawIsDone = lockedWithdraw;
    this.updated_at = new Date();
  }
}

export class CMNProjectProtocol {
  public readonly id: string;
  public projects: CMNProject[];
  public updated_at: Date;
  public protocolFee: BN;
  public feeTo: string;
  public acceptedTokens: any[];

  constructor(id, protocolFee, feeTo, projects, acceptedTokens) {
    this.protocolFee = protocolFee;
    this.feeTo = feeTo;
    this.id = id;
    this.projects = projects;
    this.acceptedTokens = acceptedTokens;
    this.updated_at = new Date();
  }

  public static fromJSON({ id, protocolFee, feeTo, projects, acceptedTokens }) {
    return new CMNProjectProtocol(
      id,
      protocolFee,
      feeTo,
      projects,
      acceptedTokens
    );
  }

  public set(protocolFee, feeTo, projects, acceptedTokens) {
    this.protocolFee = protocolFee;
    this.feeTo = feeTo;
    this.projects = projects;
    this.acceptedTokens = acceptedTokens;
    this.updated_at = new Date();
  }
}

export class CMNMembers {
  public readonly id: string;
  public backers: any;
  public curators: any;
  public updated_at: Date;

  constructor(id, backers, curators) {
    this.id = id;
    this.backers = backers;
    this.curators = curators;
    this.updated_at = new Date();
  }

  public static fromJSON({ id, backers, curators }) {
    return new CMNMembers(id, backers, curators);
  }

  public set(backers: any, curators: any) {
    this.backers = backers;
    this.curators = curators;
    this.updated_at = new Date();
  }
}

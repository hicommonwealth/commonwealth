import BN from 'bn.js';
import { EthereumCoin } from 'shared/adapters/chain/ethereum/types';

type ProjectStatus = 'In Progress' | 'Successed' | 'Failed';

export class CMNProject {
  public readonly name: string;
  public readonly description: string;
  public readonly ipfsHash: string;
  public readonly cwUrl: string;
  public readonly beneficiary: string;
  public readonly acceptedTokens: any[];
  public readonly nominations: Array<string>;
  public readonly endTime: Date;
  public readonly projectHash: string;
  public readonly status: ProjectStatus;
  public readonly withdrawIsDone: boolean;
  public readonly cTokens: any; // cTokens address
  public readonly bTokens: any; // bTokens address

  public readonly threshold: EthereumCoin;
  public readonly totalFunding: EthereumCoin;
  public readonly curatorFee: number;
  public readonly address: string;

  constructor(
    name,
    description,
    ipfsHash,
    cwUrl,
    beneficiary,
    acceptedTokens,
    nominations,
    threshold,
    endTime,
    curatorFee,
    projectHash,
    status,
    lockedWithdraw,
    totalFunding,
    bTokens,
    cTokens,
    projAddress
  ) {
    this.name = name;
    this.description = description;
    this.ipfsHash = ipfsHash;
    this.cwUrl = cwUrl;
    this.beneficiary = beneficiary;
    this.acceptedTokens = acceptedTokens;
    this.nominations = nominations;
    this.threshold = threshold;
    this.endTime = endTime;
    this.curatorFee = curatorFee;
    this.projectHash = projectHash;
    this.status = status;
    this.withdrawIsDone = lockedWithdraw;
    this.totalFunding = totalFunding;
    this.bTokens = bTokens;
    this.cTokens = cTokens;
    this.address = projAddress;
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
    return new CMNProjectProtocol(id, protocolFee, feeTo, projects, acceptedTokens);
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

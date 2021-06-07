import BN from 'bn.js';
import { EthereumCoin } from 'shared/adapters/chain/ethereum/types';

type ProjectStatus = 'In Progress' | 'Successed' | 'Failed';

export interface CWUser {
  balance: number;
  address: string;
}
export class CWProject { 
  public readonly name: string;
  public readonly description: string;
  public readonly ipfsHash: string;
  public readonly cwUrl: string;
  public readonly beneficiary: string;
  public readonly acceptedToken: string;
  public readonly nominations: Array<string>;
  public readonly endTime: Date;
  public readonly projectHash: string;
  public readonly status: ProjectStatus;
  public readonly withdrawIsDone: boolean;
  public readonly cToken: string; // cToken address
  public readonly bToken: string; // bToken address

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
    acceptedToken,
    nominations,
    threshold,
    endTime,
    curatorFee,
    projectHash,
    status,
    lockedWithdraw,
    totalFunding,
    bToken,
    cToken,
    projAddress
  ) {
    this.name = name;
    this.description = description;
    this.ipfsHash = ipfsHash;
    this.cwUrl = cwUrl;
    this.beneficiary = beneficiary;
    this.acceptedToken = acceptedToken;
    this.nominations = nominations;
    this.threshold = threshold;
    this.endTime = endTime;
    this.curatorFee = curatorFee;
    this.projectHash = projectHash;
    this.status = status;
    this.withdrawIsDone = lockedWithdraw;
    this.totalFunding = totalFunding;
    this.bToken = bToken;
    this.cToken = cToken;
    this.address = projAddress;
  }
}

export class CWProtocol {
  public readonly id: string;
  public protocolFee: BN;
  public feeTo: string;
  public projects: CWProject[];
  public updated_at: Date;

  constructor(id, protocolFee, feeTo, projects) {
   this.protocolFee = protocolFee;
   this.feeTo = feeTo;
   this.id = id;
   this.projects = projects;
   this.updated_at = new Date();
  }

  public static fromJSON({ id, protocolFee, feeTo, projects }) {
    return new CWProtocol(id, protocolFee, feeTo, projects);
  }

  public setProjects(_projects: CWProject[]) {
    this.projects = _projects;
    this.updated_at = new Date();
  }
}

export class CWProtocolMembers {
  public readonly id: string;
  public backers: CWUser[];
  public curators: CWUser[];
  public updated_at: Date;

  constructor(id, backers, curators) {
   this.id = id;
   this.backers = backers;
   this.curators = curators;
   this.updated_at = new Date();
  }

  public static fromJSON({ id, backers, curators }) {
    return new CWProtocolMembers(id, backers, curators);
  }


  public setParticipants(backers: CWUser[], curators: CWUser[]) {
    this.backers = backers;
    this.curators = curators;
    this.updated_at = new Date();
  }
}
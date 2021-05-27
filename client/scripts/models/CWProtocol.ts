import BN from 'bn.js';
import { EthereumCoin } from 'shared/adapters/chain/ethereum/types';

type ProjectStatus = 'In Progress' | 'Successed' | 'Failed';
type ParticipantRole = 'backer' | 'curator' | 'beneficiary' | 'creator'

interface CWUser {
  id?: number;
  address: string;
  role: ParticipantRole;
  projectHash: string;
  amount: number;
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
  public readonly cToken: string; // cToken address
  public readonly bToken: string; // bToken address
  // public readonly backers: Array<CWUser>;
  // public readonly curators: Array<CWUser>;

  public readonly threshold: EthereumCoin;
  public readonly totalFunding: EthereumCoin;
  public readonly curatorFee: number;

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
    totalFunding,
    bToken,
    // backers,
    cToken,
    // curators,
  ) {
    this.name = name;
    this.description = description;
    this.ipfsHash = ipfsHash;
    this.cwUrl = cwUrl;
    this.beneficiary = beneficiary;
    this.acceptedToken = acceptedToken;  //  '0x0000000000000000000000000000000000000000',
    this.nominations = nominations;
    this.threshold = threshold;
    this.endTime = endTime; // startTime + number in seconds
    this.curatorFee = curatorFee;
    this.projectHash = projectHash;  // put projectHash
    this.status = status;
    this.totalFunding = totalFunding;
    this.bToken = bToken;
    // this.backers = backers;
    this.cToken = cToken;
    // this.curators = curators;
  }
}

export class CWProtocol {
  public readonly id: string;
  public protocolFee: BN;
  public feeTo: string;
  public name: string;
  public projects: CWProject[];

  constructor(name, id, protocolFee, feeTo, projects) {
   this.protocolFee = protocolFee;
   this.feeTo = feeTo;
   this.name = name;
   this.id = id;
   this.projects = projects;
  }

  public static fromJSON({ name, id, protocolFee, feeTo, projects }) {
    return new CWProtocol(name, id, protocolFee, feeTo, projects);
  }

  public setProjects(_projects: CWProject[]) {
    this.projects = _projects;
  }
}
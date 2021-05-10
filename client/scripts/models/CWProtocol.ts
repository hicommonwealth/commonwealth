type ProjectStatus = 'In Progress' | 'Successed' | 'Failed';
type ParticipantRole = 'backer' | 'curator' | 'beneficiary' | 'creator'

export interface CWUser {
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
  public readonly acceptedToken: string;  //  '0x01',
  public readonly nominations: Array<string>;  //  []
  public readonly threshold: number;
  public readonly endTime: Date; // startTime + number in seconds
  public readonly curatorFee: number;
  public readonly projectHash: string;  // put projectHash
  public readonly status: ProjectStatus;
  public readonly totalFunding: number;
  public readonly backers: Array<CWUser>;
  public readonly curators: Array<CWUser>;

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
    backers,
    curators,
  ) {
    this.name = name;
    this.description = description;
    this.ipfsHash = ipfsHash;
    this.cwUrl = cwUrl;
    this.beneficiary = beneficiary;
    this.acceptedToken = acceptedToken;  //  '0x01',
    this.nominations = nominations;
    this.threshold = threshold;
    this.endTime = endTime; // startTime + number in seconds
    this.curatorFee = curatorFee;
    this.projectHash = projectHash;  // put projectHash
    this.status = status;
    this.totalFunding = totalFunding;
    this.backers = backers;
    this.curators = curators;
  }
}

export class CWProtocol {
  public protocolFee: number;
  public feeTo: string;
  public name: string;
  public id: string;
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
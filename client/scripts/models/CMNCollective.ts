import BN from 'bn.js';
import { EthereumCoin } from 'shared/adapters/chain/ethereum/types';

export interface CMNUser {
  balance: number;
  address: string;
}

export class CMNCollective {
  public readonly name: string;
  public readonly description: string;
  public readonly ipfsHash: string;
  public readonly cwUrl: string;
  public readonly creator: string;
  public readonly beneficiary: string;
  public readonly acceptedTokens: string[];
  public readonly nominations: Array<string>;

  public readonly address: string;

  constructor(name, description, ipfsHash, cwUrl, creator, beneficiary, acceptedTokens, nominations, colAddress) {
    this.name = name;
    this.description = description;
    this.ipfsHash = ipfsHash;
    this.cwUrl = cwUrl;
    this.creator = creator;
    this.beneficiary = beneficiary;
    this.acceptedTokens = acceptedTokens;
    this.nominations = nominations;
    this.address = colAddress;
  }
}

export class CMNCollectiveProtocol {
  public readonly id: string;
  public collectives: CMNCollective[];
  public updated_at: Date;

  constructor(id, collectives) {
    this.id = id;
    this.collectives = collectives;
    this.updated_at = new Date();
  }

  public static fromJSON({ id, collectives }) {
    return new CMNCollectiveProtocol(id, collectives);
  }

  public setCollectives(_collectives: CMNCollective[]) {
    this.collectives = _collectives;
    this.updated_at = new Date();
  }
}

export class CMNCollectiveMembers {
  public readonly id: string;
  public backers: CMNUser[];
  public updated_at: Date;

  constructor(id, backers) {
    this.id = id;
    this.backers = backers;
    this.updated_at = new Date();
  }

  public static fromJSON({ id, backers }) {
    return new CMNCollectiveMembers(id, backers);
  }

  public setParticipants(backers: CMNUser[]) {
    this.backers = backers;
    this.updated_at = new Date();
  }
}

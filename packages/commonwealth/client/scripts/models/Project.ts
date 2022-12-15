import BN from 'bn.js';
import * as CommonwealthTypes from 'chain-events/src/chains/commonwealth/types';
import ChainEntityT from './ChainEntity';
import { CWParticipant } from '../controllers/chain/ethereum/commonwealth/participants';
import AddressInfo from './AddressInfo';
import { weiToTokens } from '../helpers';

const projectDefaults = {
  title: 'Untitled Crowdfund',
  description: 'This project has not been provided with a description.',
  coverImage: '/static/img/crowdfund_default.png',
};

/*
A project consists of several parts, which must be queried separately:
1. a ChainEntityMeta, which acts as the main access point in the CMN DB
2. a ChainEntity on the CE server, which contains the chain-related data
3. an IPFS blob containing metadata about the proposal, such as description etc,
   referenced by an IPFS hash on the create event
*/

export type IProjectCreationData = {
  title: string; // TODO length limits for contract side
  shortDescription: string;
  description: string;
  coverImage: string;
  chainId: string;
  token: string;
  creator: string;
  beneficiary: string;
  threshold: string;
  deadline: number;
  curatorFee: number;
};

class Project {
  public get id() { return this.createdEvent.id }
  public get address() { return this.createdEvent.id; }
  public get creator() { return this.createdEvent.creator; }
  public get beneficiary() { return this.createdEvent.beneficiary; }
  public get token() { return this.createdEvent.acceptedToken; }

  public get curatorFee() { return +this.createdEvent.curatorFee; }
  public get threshold() { return new BN(this.createdEvent.threshold); }
  public get deadline() { return this.createdEvent.deadline; }
  public get createdAt() { return this._entity.createdAt; }

  public get title() { return this._ipfsData?.title || projectDefaults.title; }
  public get description() { return this._ipfsData?.description || projectDefaults.description; }
  public get shortDescription() { return this._ipfsData?.shortDescription || projectDefaults.description; }
  public get coverImage() { return this._ipfsData?.coverImage || projectDefaults.coverImage; }

  public get chainId() { return this._projectChain; }

  public get fundingAmount() {
    const backerFunding = this.backEvents.reduce(
      (prev, curr) => prev.add(new BN(curr.amount)), new BN(0)
    );
    const curatorFunding = this.curateEvents.reduce(
      (prev, curr) => prev.add(new BN(curr.amount)), new BN(0)
    );
    return backerFunding.add(curatorFunding);
  }

  public setEntity(entity: ChainEntityT) {
    if (entity.typeId !== this._entity.typeId) {
      throw new Error('Mismatched entity ids, cannot update');
    }
    this._entity = entity;
  }
  public setProjectChain(projectChain: string) {
    this._projectChain = projectChain;
  }

  constructor(
    private _entity: ChainEntityT,
    private _ipfsData: IProjectCreationData,
    private _projectChain?: string,
  ) {

  }

  // Event getters
  public get createdEvent(): CommonwealthTypes.IProjectCreated {
    return this._entity.chainEvents.find(
      ({ type }) =>
        type.eventName === CommonwealthTypes.EventKind.ProjectCreated
    ).data as CommonwealthTypes.IProjectCreated;
  }

  public get backEvents(): CommonwealthTypes.IProjectBacked[] {
    return this._entity.chainEvents
      .filter(
        ({ type }) =>
          type.eventName === CommonwealthTypes.EventKind.ProjectBacked
      )
      .map(({ data }) => data as CommonwealthTypes.IProjectBacked);
  }

  public get curateEvents(): CommonwealthTypes.IProjectCurated[] {
    return this._entity.chainEvents
      .filter(
        ({ type }) =>
          type.eventName === CommonwealthTypes.EventKind.ProjectCurated
      )
      .map(({ data }) => data as CommonwealthTypes.IProjectCurated);
  }

  public get succeededEvent(): CommonwealthTypes.IProjectSucceeded | null {
    const evt = this._entity.chainEvents.find(
      ({ type }) =>
        type.eventName === CommonwealthTypes.EventKind.ProjectSucceeded
    );
    if (evt) {
      return evt.data as CommonwealthTypes.IProjectSucceeded;
    }
    return null;
  }

  public get failedEvent(): CommonwealthTypes.IProjectFailed | null {
    const evt = this._entity.chainEvents.find(
      ({ type }) => type.eventName === CommonwealthTypes.EventKind.ProjectFailed
    );
    if (evt) {
      return evt.data as CommonwealthTypes.IProjectFailed;
    }
    return null;
  }

  // Helper getters
  public get completionPercent(): number {
    return (
      +weiToTokens(this.fundingAmount.toString(), 18) /
      +weiToTokens(this.threshold.toString(), 18)
    );
  }

  public get creatorAddressInfo(): AddressInfo {
    return new AddressInfo(
      null,
      this.creator,
      this.chainId || 'ethereum',
      null
    );
  }

  public isEnded(currentBlockNumber: number): boolean {
    return currentBlockNumber > this.deadline;
  }

  public get withdrawEvents(): CommonwealthTypes.IProjectWithdraw[] {
    return this._entity.chainEvents
      .filter(
        ({ type }) =>
          type.eventName === CommonwealthTypes.EventKind.ProjectWithdraw
      )
      .map(({ data }) => data as CommonwealthTypes.IProjectWithdraw);
  }

  // Role getters
  public get backers(): CWParticipant[] {
    const backerAmounts: { [address: string]: BN } = {};
    return [
      new CWParticipant(
        this,
        '0xDaB156b7F2aFcBE63301eB2C81941703b808B28C',
        new BN(5000000000000000)
      ),
    ];

    // XXX TODO: re-enable this
    this.backEvents.forEach((event) => {
      const runningTotal = backerAmounts[event.sender] || new BN(0);
      backerAmounts[event.sender] = runningTotal.add(new BN(event.amount));
    });

    return this.backEvents.map((event) => {
      return new CWParticipant(this, event.sender, backerAmounts[event.sender]);
    });
  }

  public get curators(): CWParticipant[] {
    const curatorAmounts: { [address: string]: BN } = {};

    this.curateEvents.forEach((event) => {
      const runningTotal = curatorAmounts[event.sender] || new BN(0);
      curatorAmounts[event.sender] = runningTotal.add(new BN(event.amount));
    });

    return this.curateEvents.map((event) => {
      return new CWParticipant(
        this,
        event.sender,
        curatorAmounts[event.sender]
      );
    });
  }

  // Role checks
  public isAuthor(address: string, chainId: string): boolean {
    if (!this.chainId) return false;
    return this.address === address && this.chainId === chainId;
  }

  public isBacker(address: string, chainId: string): boolean {
    if (!this.chainId) return false;
    return this.backers.some(
      (backer: CWParticipant) =>
        backer.address === address && this.chainId === chainId
    );
  }

  public getBackedAmount(address: string, chainId: string): BN {
    if (!this.isBacker(address, chainId)) return null;
    let totalAmount = new BN(0);
    this.backers.forEach((backer: CWParticipant) => {
      if (backer.address === address && this.chainId === chainId) {
        totalAmount = totalAmount.add(backer.amount);
      }
    });
    return totalAmount;
  }

  public isCurator(address: string, chainId: string): boolean {
    if (!this.chainId) return false;
    return this.curators.some(
      (curator: CWParticipant) =>
        curator.address === address && this.chainId === chainId
    );
  }

  public getCuratedAmount(address: string, chainId: string): BN {
    if (!this.isCurator(address, chainId)) return null;
    let totalAmount = new BN(0);
    this.curators.forEach((curator: CWParticipant) => {
      if (curator.address === address && this.chainId === chainId) {
        totalAmount = totalAmount.add(curator.amount);
      }
    });
    return totalAmount;
  }
}

export default Project;

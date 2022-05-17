import BN from 'bn.js';
import moment from 'moment';
import { CommonwealthTypes } from '@commonwealth/chain-events';
import ChainEntityT from './ChainEntity';
import { CWParticipant } from '../controllers/chain/ethereum/commonwealth/participants';
import AddressInfo from './AddressInfo';

class Project {
  public get createdEvent(): CommonwealthTypes.IProjectCreated {
    return this.entity.chainEvents.find(
      ({ type }) =>
        type.eventName === CommonwealthTypes.EventKind.ProjectCreated
    ).data as CommonwealthTypes.IProjectCreated;
  }

  // address of Project contract
  public get address(): string {
    return this.createdEvent.id;
  }

  public get backEvents(): CommonwealthTypes.IProjectBacked[] {
    return this.entity.chainEvents
      .filter(
        ({ type }) =>
          type.eventName === CommonwealthTypes.EventKind.ProjectBacked
      )
      .map(({ data }) => data as CommonwealthTypes.IProjectBacked);
  }

  public get curateEvents(): CommonwealthTypes.IProjectCurated[] {
    return this.entity.chainEvents
      .filter(
        ({ type }) =>
          type.eventName === CommonwealthTypes.EventKind.ProjectCurated
      )
      .map(({ data }) => data as CommonwealthTypes.IProjectCurated);
  }

  public get succeededEvent(): CommonwealthTypes.IProjectSucceeded | null {
    const evt = this.entity.chainEvents.find(
      ({ type }) =>
        type.eventName === CommonwealthTypes.EventKind.ProjectSucceeded
    );
    if (evt) {
      return evt.data as CommonwealthTypes.IProjectSucceeded;
    }
    return null;
  }

  public get failedEvent(): CommonwealthTypes.IProjectFailed | null {
    const evt = this.entity.chainEvents.find(
      ({ type }) => type.eventName === CommonwealthTypes.EventKind.ProjectFailed
    );
    if (evt) {
      return evt.data as CommonwealthTypes.IProjectFailed;
    }
    return null;
  }

  public get withdrawEvents(): CommonwealthTypes.IProjectWithdraw[] {
    return this.entity.chainEvents
      .filter(
        ({ type }) =>
          type.eventName === CommonwealthTypes.EventKind.ProjectWithdraw
      )
      .map(({ data }) => data as CommonwealthTypes.IProjectWithdraw);
  }

  public get creatorAddressInfo(): AddressInfo {
    // TODO: Address lookup
    return null;
  }

  public get backers(): CWParticipant[] {
    const backerAmounts: { [address: string]: BN } = {};

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

  public isBacker(address: string, chainId: string): boolean {
    if (!this.chainId) return false;
    return this.backers.some(
      (backer: CWParticipant) =>
        backer.address === address && this.chainId === chainId
    );
  }

  public isCurator(address: string, chainId: string): boolean {
    if (!this.chainId) return false;
    return this.curators.some(
      (curator: CWParticipant) =>
        curator.address === address && this.chainId === chainId
    );
  }

  constructor(
    // on-chain data
    public readonly id: number,
    public readonly creator: string,
    public readonly creatorAddressId: number,
    public readonly beneficiary: string,
    public readonly token: string,
    public readonly title: string,
    public readonly description: string,
    public readonly shortDescription: string,
    public readonly coverImage: string,
    public readonly curatorFee: BN,
    public readonly threshold: BN,
    public readonly deadline: moment.Moment,
    public readonly createdAt: moment.Moment,
    public fundingAmount: BN,
    public readonly entity: ChainEntityT,
    public readonly chainId?: string
  ) {}

  public static fromJSON({
    id,
    chain_id,
    creator,
    creator_address_id,
    beneficiary,
    token,
    title,
    description,
    short_description,
    cover_image,
    curator_fee,
    threshold,
    deadline,
    created_at,
    funding_amount,
    ChainEntity,
  }: {
    id: number;
    chain_id?: string;
    creator: string;
    creator_address_id?: number;
    beneficiary: string;
    token: string;
    title: string;
    description: string;
    short_description: string;
    cover_image: string;
    curator_fee: string;
    threshold: string;
    deadline: number;
    created_at: number;
    funding_amount: string;
    ChainEntity: ChainEntityT;
  }) {
    return new Project(
      id,
      creator,
      creator_address_id,
      beneficiary,
      token,
      title,
      description,
      short_description,
      cover_image,
      new BN(curator_fee),
      new BN(threshold),
      moment.unix(deadline),
      moment.unix(created_at),
      new BN(funding_amount),
      ChainEntity,
      chain_id
    );
  }
}

export default Project;

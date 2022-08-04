import BN from 'bn.js';
import moment from 'moment';
import { CommonwealthTypes } from 'chain-events';
import ChainEntityT from './ChainEntity';

class Project {
  public get createdEvent(): CommonwealthTypes.IProjectCreated {
    return this.entity.chainEvents.find(
      ({ type }) => type.eventName === CommonwealthTypes.EventKind.ProjectCreated
    ).data as CommonwealthTypes.IProjectCreated;
  }

  // address of Project contract
  public get address(): string {
    return this.createdEvent.id;
  }

  public get backEvents(): CommonwealthTypes.IProjectBacked[] {
    return this.entity.chainEvents.filter(
      ({ type }) => type.eventName === CommonwealthTypes.EventKind.ProjectBacked
    ).map(({ data }) => data as CommonwealthTypes.IProjectBacked);
  }

  public get curateEvents(): CommonwealthTypes.IProjectCurated[] {
    return this.entity.chainEvents.filter(
      ({ type }) => type.eventName === CommonwealthTypes.EventKind.ProjectCurated
    ).map(({ data }) => data as CommonwealthTypes.IProjectCurated);
  }

  public get succeededEvent(): CommonwealthTypes.IProjectSucceeded | null {
    const evt = this.entity.chainEvents.find(
      ({ type }) => type.eventName === CommonwealthTypes.EventKind.ProjectSucceeded
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
    return this.entity.chainEvents.filter(
      ({ type }) => type.eventName === CommonwealthTypes.EventKind.ProjectWithdraw
    ).map(({ data }) => data as CommonwealthTypes.IProjectWithdraw);
  }

  constructor(
    public readonly id: number,
    public readonly creator: string,
    public readonly beneficiary: string,
    public readonly token: string,
    public readonly curatorFee: BN,
    public readonly threshold: BN,
    public readonly deadline: moment.Moment,
    public fundingAmount: BN,
    public readonly entity: ChainEntityT,
    public readonly chainId?: string,
  ) {
  }

  public static fromJSON({
    id,
    chain_id,
    creator,
    beneficiary,
    token,
    curator_fee,
    threshold,
    deadline,
    funding_amount,
    ChainEntity,
  }: {
    id: number,
    chain_id?: string,
    creator: string,
    beneficiary: string,
    token: string,
    curator_fee: string,
    threshold: string,
    deadline: number,
    funding_amount: string,
    ChainEntity: ChainEntityT,
  }) {
    return new Project(
      id,
      creator,
      beneficiary,
      token,
      new BN(curator_fee),
      new BN(threshold),
      moment.unix(deadline),
      new BN(funding_amount),
      ChainEntity,
      chain_id,
    );
  }
}

export default Project;

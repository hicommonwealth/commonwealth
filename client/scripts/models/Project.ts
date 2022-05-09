import BN from 'bn.js';
import moment from 'moment';
import ChainEntityT from './ChainEntity';

class Project {
  constructor(
    public readonly id: number,
    public readonly creator: string,
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

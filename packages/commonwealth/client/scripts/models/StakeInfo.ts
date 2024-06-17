import { Moment } from 'moment';

class StakeInfo {
  public readonly stakeId: number;
  public readonly stakeToken: string;
  public readonly voteWeight: string;
  public readonly stakeEnabled?: boolean;
  public readonly createdAt?: Moment;
  public readonly updatedAt?: Moment;

  constructor({
    stake_id,
    stake_token,
    vote_weight,
    stake_enabled,
    created_at,
    updated_at,
  }: {
    stake_id: number;
    stake_token: string;
    vote_weight: string;
    stake_enabled?: boolean;
    created_at?: Moment;
    updated_at?: Moment;
  }) {
    this.stakeId = stake_id;
    this.stakeToken = stake_token;
    this.voteWeight = vote_weight;
    this.stakeEnabled = stake_enabled;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }
}

export default StakeInfo;

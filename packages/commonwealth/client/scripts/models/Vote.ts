import * as schemas from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';

class Vote {
  public readonly id: number;
  public readonly pollId: number;
  public readonly communityId: string;
  public readonly authorCommunityId: string;
  public readonly address: string;
  public readonly createdAt: moment.Moment;
  public option: string;
  public readonly calculatedVotingWeight: string | undefined | null;

  constructor({
    id,
    poll_id,
    community_id,
    address,
    author_community_id,
    option,
    created_at,
    calculated_voting_weight,
  }: z.infer<typeof schemas.VoteView>) {
    this.id = id!;
    this.pollId = poll_id;
    this.communityId = community_id;
    this.address = address;
    this.authorCommunityId = author_community_id;
    this.option = option;
    this.createdAt = moment(created_at!);
    this.calculatedVotingWeight = calculated_voting_weight;
  }
}

export default Vote;

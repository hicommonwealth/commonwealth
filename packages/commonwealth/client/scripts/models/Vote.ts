import type moment from 'moment';

class Vote {
  public readonly id: number;
  public readonly pollId: number;
  public readonly communityId: string;
  public readonly authorCommunityId: string;
  public readonly address: string;
  public readonly createdAt: moment.Moment;
  public option: string;

  constructor({
    id,
    poll_id,
    community_id,
    address,
    author_community_id,
    option,
    created_at,
  }) {
    this.id = id;
    this.pollId = poll_id;
    this.communityId = community_id;
    this.address = address;
    this.authorCommunityId = author_community_id;
    this.option = option;
    this.createdAt = created_at;
  }
}

export default Vote;

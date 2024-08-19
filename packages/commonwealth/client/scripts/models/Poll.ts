import moment from 'moment';
import Vote from './Vote';

class Poll {
  public readonly id: number;
  public readonly threadId: number;
  public readonly communityId: string;
  public readonly createdAt: moment.Moment;
  public readonly endsAt: moment.Moment;
  public readonly prompt: string;
  public readonly options: string[];
  private readonly _votes: Vote[];

  constructor({
    id,
    threadId,
    communityId,
    createdAt,
    endsAt,
    prompt,
    options,
    votes,
  }: {
    id: number;
    threadId: number;
    communityId: string;
    createdAt: moment.Moment;
    endsAt: moment.Moment;
    prompt: string;
    options: string[];
    votes: Vote[];
  }) {
    this.id = id;
    this.threadId = threadId;
    this.communityId = communityId;
    this.createdAt = createdAt;
    this.endsAt = endsAt;
    this.prompt = prompt;
    this.options = options;
    this._votes = votes;
  }

  public get votes() {
    return this._votes;
  }

  public getUserVote(chain: string, address: string) {
    return (this.votes || []).find(
      (vote) => vote.address === address && vote.authorCommunityId === chain,
    );
  }

  public static fromJSON(json) {
    const {
      id,
      thread_id,
      community_id,
      prompt,
      options,
      ends_at,
      votes = [],
      created_at,
    } = json;

    let pollOptions;

    try {
      pollOptions = JSON.parse(options);
    } catch (e) {
      pollOptions = [];
    }

    return new Poll({
      id,
      threadId: thread_id,
      communityId: community_id,
      prompt,
      options: pollOptions,
      endsAt: moment(ends_at),
      votes: votes.map((v) => new Vote(v)),
      createdAt: moment(created_at),
    });
  }
}

export default Poll;

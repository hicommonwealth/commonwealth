import * as schemas from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';
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
    thread_id,
    community_id,
    created_at,
    ends_at,
    prompt,
    options,
    votes,
  }: z.infer<typeof schemas.PollView>) {
    this.id = id!;
    this.threadId = thread_id;
    this.communityId = community_id;
    this.createdAt = moment(created_at!);
    this.endsAt = moment(ends_at!);
    this.prompt = prompt;
    this.options = JSON.parse(options);
    this._votes = votes?.map((vote) => new Vote(vote)) ?? [];
  }

  public get votes() {
    return this._votes;
  }
}

export default Poll;

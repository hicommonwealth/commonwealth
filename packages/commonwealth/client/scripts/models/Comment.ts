import type momentType from 'moment';
import moment from 'moment';
import AddressInfo from './AddressInfo';
import type { IUniqueId } from './interfaces';
import { addressToUserProfile, UserProfile } from './MinimumProfile';
import Reaction from './Reaction';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Comment<T extends IUniqueId> {
  public readonly communityId: string;
  public readonly author: string;
  public readonly Address: AddressInfo;
  public readonly text: string;
  public readonly plaintext: string;
  public readonly reactions: Reaction[];
  public reactionWeightsSum: number;
  public readonly id: number;
  public readonly createdAt: momentType.Moment;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly threadId: number;
  public readonly lastEdited: string;
  public markedAsSpamAt: momentType.Moment;
  public readonly deleted: boolean;
  public readonly rootThread: string;
  public readonly parentId: number;

  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;
  public readonly discord_meta: any;

  public readonly profile: UserProfile;

  constructor({
    id,
    text,
    community_id,
    author,
    Address,
    thread_id,
    parent_id,
    plaintext,
    reactions,
    reaction_weights_sum,
    created_at,
    updated_at,
    deleted_at,
    authorChain,
    canvas_hash,
    canvas_action,
    canvas_session,
    marked_as_spam_at,
    discord_meta,
  }) {
    this.communityId = community_id;
    this.author = Address?.address || author;
    this.text = deleted_at?.length > 0 ? '[deleted]' : decodeURIComponent(text);
    this.plaintext = deleted_at?.length > 0 ? '[deleted]' : plaintext;
    this.threadId = thread_id;
    this.id = id;
    this.createdAt = moment(created_at);
    this.parentComment = Number(parent_id) || null;
    this.authorChain = Address?.community_id || authorChain;
    this.lastEdited = updated_at;
    this.markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    this.deleted = deleted_at?.length > 0 ? true : false;
    this.canvasAction = canvas_action;
    this.canvasSession = canvas_session;
    this.canvasHash = canvas_hash;
    this.reactions = (reactions || []).map((r) => new Reaction(r));
    this.reactionWeightsSum = reaction_weights_sum;
    this.rootThread = thread_id;
    this.discord_meta = discord_meta;

    this.profile = addressToUserProfile(Address);
  }
}

export default Comment;

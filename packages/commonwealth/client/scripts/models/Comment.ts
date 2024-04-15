import { VersionHistory } from 'models/Thread';
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
  public readonly versionHistory: VersionHistory[];
  public readonly lastEdited: string;
  public markedAsSpamAt: momentType.Moment;
  public readonly deleted: boolean;
  public readonly rootThread: string;
  public readonly parentId: number;

  public readonly canvasSignedData: string;
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
    deleted_at,
    authorChain,
    last_edited,
    canvas_signed_data,
    canvas_hash,
    version_history,
    marked_as_spam_at,
    discord_meta,
  }) {
    const versionHistory = version_history
      ? version_history.map((v) => {
          if (!v) return;
          let history;
          try {
            history = JSON.parse(v || '{}');
            history.author =
              typeof history.author === 'string'
                ? JSON.parse(history.author)
                : typeof history.author === 'object'
                ? history.author
                : null;
            history.timestamp = moment(history.timestamp);
          } catch (e) {
            console.log(e);
          }
          return history;
        })
      : [];

    this.communityId = community_id;
    this.author = Address?.address || author;
    this.text = deleted_at?.length > 0 ? '[deleted]' : decodeURIComponent(text);
    this.plaintext = deleted_at?.length > 0 ? '[deleted]' : plaintext;
    this.versionHistory = versionHistory;
    this.threadId = thread_id;
    this.id = id;
    this.createdAt = moment(created_at);
    this.parentComment = Number(parent_id) || null;
    this.authorChain = Address?.community_id || authorChain;
    this.lastEdited = last_edited
      ? moment(last_edited)
      : versionHistory && versionHistory?.length > 1
      ? versionHistory[0].timestamp
      : null;
    this.markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    this.deleted = deleted_at?.length > 0 ? true : false;
    this.canvasSignedData = canvas_signed_data;
    this.canvasHash = canvas_hash;
    this.reactions = (reactions || []).map((r) => new Reaction(r));
    this.reactionWeightsSum = reaction_weights_sum;
    this.rootThread = thread_id;
    this.discord_meta = discord_meta;

    this.profile = addressToUserProfile(Address);
  }
}

export default Comment;

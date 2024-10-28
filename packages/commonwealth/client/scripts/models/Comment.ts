import { getDecodedString } from '@hicommonwealth/shared';
import type momentType from 'moment';
import moment, { Moment } from 'moment';
import AddressInfo from './AddressInfo';
import type { IUniqueId } from './interfaces';
import { addressToUserProfile, UserProfile } from './MinimumProfile';
import Reaction from './Reaction';

export interface CommentVersionHistory {
  id: number;
  thread_id: number;
  address: string;
  body: string;
  text?: string;
  timestamp: Moment;
  content_url: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Comment<T extends IUniqueId> {
  public readonly communityId: string;
  public readonly author: string;
  public readonly Address: AddressInfo;
  public readonly text: string;
  public reactions: Reaction[];
  public reactionWeightsSum: number;
  public readonly id: number;
  public readonly createdAt: momentType.Moment;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly threadId: number;
  public readonly versionHistory: CommentVersionHistory[];
  public readonly lastEdited: string;
  public markedAsSpamAt: momentType.Moment;
  public readonly deleted: boolean;
  public readonly rootThread: string;
  public readonly parentId: number;

  public readonly canvasSignedData: string;
  public readonly canvasMsgId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly discord_meta: any;

  public readonly profile: UserProfile;

  public contentUrl: string | null;

  constructor({
    id,
    text,
    body,
    author,
    community_id,
    Address,
    thread_id,
    parent_id,
    reactions,
    reaction_weights_sum,
    created_at,
    deleted_at,
    authorChain,
    last_edited,
    canvas_signed_data,
    canvas_msg_id,
    CommentVersionHistories,
    marked_as_spam_at,
    discord_meta,
    content_url,
  }: {
    id: number;
    text?: string;
    body?: string;
    author: string;
    community_id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Address: any;
    thread_id: number;
    parent_id?: number | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reactions?: any[];
    reaction_weights_sum: number;
    created_at: Moment | null;
    deleted_at?: string;
    authorChain?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    last_edited?: any;
    canvas_signed_data?: string | null;
    canvas_msg_id?: string | null;
    CommentVersionHistories?: CommentVersionHistory[];
    marked_as_spam_at?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    discord_meta?: any;
    content_url?: string | null;
  }) {
    const versionHistory = CommentVersionHistories;
    this.communityId = community_id;
    this.author = Address?.address || author;
    if (deleted_at && deleted_at?.length > 0) this.text = '[deleted]';
    // TODO: temporary - this model will be entirely replaced by tRPC soon
    else this.text = text ? getDecodedString(text) : getDecodedString(body!);
    this.versionHistory = versionHistory!;
    this.threadId = thread_id;
    this.id = id;
    this.createdAt = moment(created_at);
    // @ts-expect-error StrictNullChecks
    this.parentComment = Number(parent_id) || null;
    this.authorChain = Address?.community_id || authorChain;
    this.lastEdited = (last_edited
      ? moment(last_edited)
      : versionHistory && versionHistory?.length > 1
        ? versionHistory[0].timestamp
        : null) as unknown as string;
    // @ts-expect-error StrictNullChecks
    this.markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    this.deleted = !!deleted_at;
    this.canvasSignedData = canvas_signed_data!;
    this.canvasMsgId = canvas_msg_id!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.reactions = (reactions || []).map((r) => new Reaction(r as any));
    this.reactionWeightsSum = reaction_weights_sum;
    this.rootThread = String(thread_id);
    this.discord_meta = discord_meta;
    this.contentUrl = content_url!;

    this.profile = addressToUserProfile(Address);
  }
}

export default Comment;

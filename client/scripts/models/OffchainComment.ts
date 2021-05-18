import moment from 'moment';
import { VersionHistory } from '../controllers/server/threads';
import { IUniqueId } from './interfaces';
import OffchainAttachment from './OffchainAttachment';
import OffchainThread from './OffchainThread';

class OffchainComment<T extends IUniqueId> {
  [x: string]: any;
  public readonly chain: string;
  public readonly author: string;
  public readonly text: string;
  public readonly plaintext: string;
  public readonly attachments: OffchainAttachment[];
  public readonly proposal: T; // this may not be populated if the comment was loaded before the proposal!
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly community?: string;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly rootProposal: number;
  public readonly childComments: number[];
  public readonly versionHistory: VersionHistory[];
  public readonly lastEdited: moment.Moment;

  constructor({
    chain,
    author,
    text,
    plaintext,
    versionHistory,
    attachments,
    proposal,
    id,
    createdAt,
    childComments = [],
    rootProposal,
    // optional args
    parentComment,
    community,
    authorChain,
    lastEdited, // moment.Moment
  }) {
    this.chain = chain;
    this.author = author;
    this.text = text;
    this.plaintext = plaintext;
    this.versionHistory = versionHistory;
    this.attachments = attachments;
    this.proposal = proposal;
    this.id = id;
    this.createdAt = createdAt;
    this.childComments = childComments;
    this.parentComment = parentComment;
    this.rootProposal = rootProposal;
    this.community = community;
    this.authorChain = authorChain;
    this.lastEdited = lastEdited;
  }

  public static fromJSON(comment) {
    const attachments = comment.OffchainAttachments
      ? comment.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
      : [];
    let proposal;
    try {
      const proposalSplit = decodeURIComponent(comment.root_id).split(/-|_/);
      if (proposalSplit[0] === 'discussion') {
        proposal = new OffchainThread({
          author: '',
          title: '',
          attachments: null,
          id: Number(proposalSplit[1]),
          createdAt: comment.created_at,
          topic: null,
          kind: null,
          stage: null,
          community: comment.community,
          chain: comment.chain,
          versionHistory: null,
          readOnly: null,
        });
      } else {
        proposal = {
          chain: comment.chain,
          community: comment.community,
          slug: proposalSplit[0],
          identifier: proposalSplit[1],
        };
      }
    } catch (e) {
      proposal = null;
    }
    return new OffchainComment({
      chain: comment.chain,
      author: comment?.Address?.address || comment.author,
      text: decodeURIComponent(comment.text),
      plaintext: comment.plaintext,
      versionHistory: comment.version_history,
      attachments,
      proposal,
      id: comment.id,
      createdAt: moment(comment.created_at),
      childComments: comment.child_comments,
      rootProposal: comment.root_id,
      parentComment: comment.parent_id,
      community: comment.community,
      authorChain: comment?.Address?.chain || comment.authorChain,
      lastEdited: null,
    });
  }
}

export default OffchainComment;

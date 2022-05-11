import moment from 'moment';
import { VersionHistory } from '../controllers/server/threads';
import AddressInfo from './AddressInfo';
import { IUniqueId } from './interfaces';
import OffchainAttachment from './OffchainAttachment';

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
  public readonly rootProposal: string;
  public readonly versionHistory: VersionHistory[];
  public readonly lastEdited: moment.Moment;
  public readonly deleted: boolean;
  public readonly addressInfo: AddressInfo;

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
    rootProposal,
    // optional args
    parentComment,
    community,
    authorChain,
    lastEdited, // moment.Moment
    deleted, 
    address
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
    this.parentComment = parentComment;
    this.rootProposal = rootProposal;
    this.community = community;
    this.authorChain = authorChain;
    this.lastEdited = lastEdited;
    this.deleted = deleted;
    this.addressInfo = new AddressInfo(
      address.id, 
      address.address, 
      address.chain, 
      address.keytype, 
      address.wallet_id, 
      address.ghost_address
    );
  }

  public static fromJSON({
    id,
    chain, 
    parent_id,
    address_id,
    text,
    created_at,
    updated_at,
    deleted_at,
    version_history,
    root_id,
    plaintext,
    _search,
    Address,
  }) {
    return new OffchainComment({
      id,
      chain,
      parentComment: parent_id,
      text: text,
      plaintext: plaintext,
      createdAt: created_at,
      versionHistory: version_history,
      lastEdited: updated_at,
      address: Address,
    })
  }

}

export default OffchainComment;

import { ProposalType } from '@hicommonwealth/core';
import type moment from 'moment';
import type Topic from './Topic';
import type { IUniqueId } from './interfaces';

class AbridgedThread implements IUniqueId {
  public readonly id: number;
  public readonly address: string;
  public readonly addressId: number;
  public readonly authorChain: string;
  public readonly title: string;
  public readonly createdAt: moment.Moment;
  public readonly community: string;
  public readonly topic?: Topic;
  public readonly pinned?: boolean;
  public readonly url?: string;

  public readonly slug = ProposalType.Thread;
  public readonly identifier: string;

  public get uniqueIdentifier() {
    return `${this.slug}_${this.identifier}`;
  }

  constructor(
    id: number,
    address_id: number,
    address: string,
    author_chain: string,
    title: string,
    created_at: moment.Moment,
    community: string,
    topic: any,
    pinned?: boolean,
    url?: string,
  ) {
    this.id = id;
    this.identifier = `${id}`;
    this.addressId = address_id;
    this.address = address;
    this.authorChain = author_chain;
    this.title = title;
    this.createdAt = created_at;
    this.community = community;
    this.topic = topic;
    this.pinned = pinned;
    this.url = url;
  }
}

export default AbridgedThread;

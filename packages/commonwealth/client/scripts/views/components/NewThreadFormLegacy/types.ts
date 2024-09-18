import type Topic from '../../../models/Topic';
import type { ThreadKind } from '../../../models/types';

export type NewThreadFormType = {
  threadKind: ThreadKind;
  threadTitle: string;
  threadTopic: Topic;
  threadUrl?: string;
};

export enum NewThreadErrors {
  NoBody = 'Thread body cannot be blank',
  NoTopic = 'Thread must have a topic',
  NoTitle = 'Title cannot be blank',
  NoUrl = 'URL cannot be blank',
}

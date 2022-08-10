import { ThreadKind } from 'models';

export type NewThreadFormType = {
  kind: ThreadKind;
  title: string;
  topicId: number;
  topicName: string;
  url?: string;
};

export enum NewThreadErrors {
  NoBody = 'Thread body cannot be blank',
  NoTopic = 'Thread must have a topic',
  NoTitle = 'Title cannot be blank',
  NoUrl = 'URL cannot be blank',
}

export enum NewDraftErrors {
  InsufficientData = 'Draft must have a text body.',
}

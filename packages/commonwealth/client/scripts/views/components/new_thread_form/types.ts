export enum ThreadKind {
  Discussion = 'discussion',
  Link = 'link',
}

export interface INewThreadForm {
  topicName: string;
  topicId: number;
  title: string;
  url?: string;
  kind: ThreadKind;
}

export enum NewThreadErrors {
  NoBody = 'Thread body cannot be blank',
  NoTopic = 'Thread must have a topic',
  NoTitle = 'Title cannot be blank',
  NoUrl = 'URL cannot be blank',
}

export enum NewDraftErrors {
  InsufficientData = 'Draft must have a text body.',
}

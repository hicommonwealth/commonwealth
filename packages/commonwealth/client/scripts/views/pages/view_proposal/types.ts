import { Poll, Thread, Comment, AnyProposal } from 'models';

export type Prefetch = {
  [identifier: string]: {
    commentsStarted: boolean;
    pollsStarted: boolean;
    viewCountStarted: boolean;
    profilesStarted: boolean;
    profilesFinished: boolean;
  };
};

export type ProposalPageState = {
  comments: Comment<Thread>[];
  polls: Poll[];
  editing: boolean;
  highlightedComment: boolean;
  parentCommentId: number; // if null or undefined, reply is thread-scoped
  prefetch: Prefetch;
  proposal: AnyProposal | Thread;
  recentlyEdited: boolean;
  recentlySubmitted: number; // comment ID for CSS highlight transitions
  replying: boolean;
  tabSelected: 'viewProposal' | 'viewSidebar';
  threadFetched;
  threadFetchFailed;
  tipAmount: number;
  viewCount: number;
};

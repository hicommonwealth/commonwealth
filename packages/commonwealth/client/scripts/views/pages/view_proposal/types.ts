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
  highlightedComment: boolean;
  isGloballyEditing: boolean;
  polls: Poll[];
  prefetch: Prefetch;
  proposal: AnyProposal | Thread;
  recentlyEdited: boolean;
  recentlySubmitted: number; // comment ID for CSS highlight transitions
  replying: boolean;
  tabSelected: 'viewProposal' | 'viewSidebar';
  threadFetched: boolean;
  threadFetchFailed: boolean;
  tipAmount: number;
  viewCount: number;
};

export type Prefetch = {
  [identifier: string]: {
    commentsStarted: boolean;
    pollsStarted: boolean;
    viewCountStarted: boolean;
    profilesStarted: boolean;
    profilesFinished: boolean;
  };
};

import { Projection, schemas } from '@hicommonwealth/core';

const inputs = {
  ContestManagerDeployed: schemas.events.ContestManagerDeployed,
  ContestStarted: schemas.events.ContestStarted,
  ContestContentAdded: schemas.events.ContestContentAdded,
  ContestContentUpvoted: schemas.events.ContestContentUpvoted,
  ContestWinnersRecorded: schemas.events.ContestWinnersRecorded,
};

export const Contests: Projection<typeof inputs> = () => ({
  inputs,
  body: {
    ContestManagerDeployed: async () => {},
    ContestStarted: async () => {},
    ContestContentAdded: async () => {},
    ContestContentUpvoted: async () => {},
    ContestWinnersRecorded: async () => {},
  },
});

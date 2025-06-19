import { GraphQLClient } from 'graphql-request';
import { config } from './config';
import { RailWayAPI } from './constants';
import { getSdk } from './generated/graphql';

const client = new GraphQLClient(RailWayAPI, {
  headers: {
    authorization: `Bearer ${config.RAILWAY!.TOKEN}`,
  },
});

export const sdk = getSdk(client);

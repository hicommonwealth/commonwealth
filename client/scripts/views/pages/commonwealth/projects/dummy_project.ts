import { AddressInfo } from 'client/scripts/models';
import { CWBacker } from 'controllers/chain/ethereum/commonwealth/participants';
import moment from 'moment';
import { Project } from '.';

const DummyBeneficiary: AddressInfo = {
  id: 1,
  address: 'FxgH3tdaeDm0b67zx',
  chain: 'ethereum',
  keytype: 'irrelevant',
  walletId: null,
  ghostAddress: false,
};

export const DummyProject: Project = {
  id: 1,
  title: 'Name of Project',
  chain: 'ethereum',
  description:
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor` +
    `incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation` +
    `ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit ` +
    `in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat ` +
    `non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. \n` +
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor` +
    `incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation` +
    `ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit ` +
    `in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat ` +
    `non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. \n` +
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor` +
    `incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation` +
    `ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit ` +
    `in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat ` +
    `non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  shortDescription:
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor` +
    `incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation` +
    `ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit ` +
    `in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat ` +
    `non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  coverImage:
    'https://d2w9rnfcy7mm78.cloudfront.net/16465542/original_01e127de59ab1b9be072a07cd8e6aeca.png?1652559364',
  token: 'dydx',
  creator: null,
  beneficiary: DummyBeneficiary,
  backers: [
    new CWBacker(1, 1, 1, 'ajslkdjfkl', 10000),
    new CWBacker(1, 1, 1, 'kcvkljurioeioei', 300000),
  ],
  curatorCut: 0.23,
  curators: [null],
  createdAt: moment(),
  progress: { inBlocks: 16000, asPercent: 0.32 },
  deadline: { inBlocks: 48000, asDate: moment('2022-05-29') },
  threshold: { inTokens: 12, inDollars: 30000 },
  raised: { inTokens: 3.8, inDollars: 9000 },
};

import { AddressInfo } from 'client/scripts/models';
import { CWParticipant } from 'controllers/chain/ethereum/commonwealth/participants';
import moment from 'moment';
import { Project } from 'models';
import BN from 'bn.js';

const DummyBeneficiary: AddressInfo = {
  id: 1,
  address: 'FxgH3tdaeDm0b67zx',
  chain: 'dydx',
  keytype: 'irrelevant',
  walletId: null,
  ghostAddress: false,
};

export const DummyProject: Project = {
  id: 1,
  address: 'skdjfkasjkjadkvnkjdfk090912',
  title: 'Name of Project',
  chainId: 'dydx',
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
  token: 'skdjfkasjkjadkvnkjdfk090912',
  creator: null,
  creatorAddressId: DummyBeneficiary.id,
  creatorAddressInfo: DummyBeneficiary,
  beneficiary: 'kcvkljurdslfkdjfioeioei',
  backers: [
    new CWParticipant(this, 'ajslkdjfkl', new BN(10000)),
    new CWParticipant(this, 'kcvkljurioeioei', new BN(300000)),
  ],
  curatorFee: new BN(0.23),
  curators: [
    new CWParticipant(this, 'ajslkdjfkl', new BN(10000)),
    new CWParticipant(this, 'kcvkljurioeioei', new BN(300000)),
  ],
  createdAt: moment(),
  deadline: moment().add('12 days'),
  threshold: new BN(12000000),
  fundingAmount: new BN(600000),

  isAuthor: () => true,
  isBacker: () => true,
  isCurator: () => true,

  createdEvent: null,
  curateEvents: null,
  backEvents: null,
  withdrawEvents: null,
  succeededEvent: null,
  failedEvent: null,

  entity: null,
};

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
  description: `Suspendisse nibh eget at auctor. Massa amet, non amet, eu eros. Mattis amet mauris mattis ornare.
    commodo eget dui dictum nec tempor, pharetra hac. Non pharetra nisl commodo eros viverra quam convallis tempus. 
    Etiam aliquam natoque vel, eget etiam tristique. Pharetra, aliquam arcu ac tortor amet lectus dolor at ut.`,
  shortDescription: 'Lorem ipsum dolor sit amet.',
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
  deadline: { inBlocks: 48000, asDate: moment() },
  threshold: { inTokens: 12, inDollars: 30000 },
  raised: { inTokens: 3.8, inDollars: 9000 },
};

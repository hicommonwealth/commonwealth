import { CWBacker } from 'controllers/chain/ethereum/projects/participants';
import moment from 'moment';
import { Project } from '.';

export const DummyProject: Project = {
  id: 1,
  title: 'Project Name',
  // eslint-disable-next-line max-len
  description: 'Suspendisse nibh eget at auctor. Massa amet, non amet, eu eros. Mattis amet mauris mattis ornare. Ut mauris, commodo eget dui dictum nec tempor, pharetra hac. Non pharetra nisl commodo eros viverra quam convallis tempus orci. Etiam aliquam natoque vel, eget etiam tristique. Pharetra, aliquam arcu ac tortor amet lectus dolor at ut. Egestas nisi.',
  shortDescription: 'Lorem ipsum dolor sit amet.',
  // eslint-disable-next-line max-len
  coverImage: 'https://d2w9rnfcy7mm78.cloudfront.net/15140445/original_934fcfa7b50e51b160a22542ebd14bc7.png?1644683177?bc=0',
  token: 'Ethereum',
  creator: null,
  beneficiary: null,
  backers: [
    new CWBacker(1, 1, 1, 'ajslkdjfkl', 10000),
    new CWBacker(1, 1, 1, 'kcvkljurioeioei', 300000)
  ],
  curators: [null],
  createdAt: moment(),
  progress: { inBlocks: 16000, asPercent: 0.32 },
  deadline: { inBlocks: 48000, asDate: moment() },
  threshold: { inTokens: 12, inDollars: 30000 },
  raised: { inTokens: 3.8, inDollars: 9000 },
}
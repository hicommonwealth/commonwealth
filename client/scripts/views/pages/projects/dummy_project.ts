import moment from "moment";
import { Project } from ".";

export const DummyProject: Project = {
  id: 1,
  title: 'Project Name',
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    + 'Sit ullamcorper tortor pretium amet eget leo. Venenatis id risus at mollis '
    + 'orci sapien integer id non eget.',
  shortDescription: 'Lorem ipsum dolor sit amet.',
  // eslint-disable-next-line max-len
  coverImage: 'https://d2w9rnfcy7mm78.cloudfront.net/15140445/original_934fcfa7b50e51b160a22542ebd14bc7.png?1644683177?bc=0',
  token: 'Ethereum',
  creator: null,
  beneficiary: null,
  backers: [null],
  curators: [null],
  createdAt: moment(),
  progress: { inBlocks: 16000, asPercent: 0.32 },
  deadline: { inBlocks: 48000, asDate: moment() },
  threshold: { inTokens: 12, inDollars: 30000 },
  raised: { inTokens: 3.8, inDollars: 9000 },
}
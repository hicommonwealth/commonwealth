import { Project } from ".";

export const DummyProject: Project = {
  title: 'Project Name',
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    + 'Sit ullamcorper tortor pretium amet eget leo. Venenatis id risus at mollis '
    + 'orci sapien integer id non eget.',
  shortDescription: 'Lorem ipsum dolor sit amet.',
  token: 'Ethereum',
  creator: null,
  beneficiary: null,
  backers: [null],
  curators: [null],
  createdAt: new Date(),
  progress: { inBlocks: 16000, asPercent: 0.32 },
  deadline: { inBlocks: 48000, asDate: new Date() },
  threshold: { inTokens: 10000000, inDollars: 30000 },
  raised: { inTokens: 3200000, inDollars: 9000 },
}
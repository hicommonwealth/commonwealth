import { ChainBase } from '@hicommonwealth/shared';
import { CommunityType } from 'views/components/component_kit/new_designs/CWCommunitySelector';

export const communityTypeOptions = [
  {
    type: CommunityType.Base,
    chainBase: ChainBase.Ethereum,
    title: 'BASE',
    isRecommended: true,
    description:
      'Base is an Ethereum Layer 2 network with high TVL and low transaction fees',
  },
  {
    type: CommunityType.Blast,
    chainBase: ChainBase.Ethereum,
    title: 'Blast',
    isRecommended: false,
    description:
      'Blast is an Ethereum Layer 2 network with high TVL, offering native yield, ' +
      'and secure decentralized app platform.',
  },
  {
    type: CommunityType.Ethereum,
    chainBase: ChainBase.Ethereum,
    title: 'Ethereum (EVM)',
    isRecommended: false,
    description:
      'Tokens built on the ERC20 protocol are fungible, meaning they are interchangeable. ' +
      'Select this community type if you have minted a token on the Ethereum blockchain.',
  },

  {
    type: CommunityType.Cosmos,
    chainBase: ChainBase.CosmosSDK,
    title: 'Cosmos',
    isRecommended: false,
    description:
      'The Cosmos Network is a decentralized network of independent, scalable, ' +
      'and interoperable blockchains, creating the foundation for a new token economy.',
  },
  {
    type: CommunityType.Polygon,
    chainBase: ChainBase.Ethereum,
    title: 'Polygon',
    isRecommended: false,
    description:
      'Polygon is built around making web3 technology accessible, with zero prior knowledge. ' +
      'Common supports communities on the Polygon network...',
  },
  {
    type: CommunityType.Solana,
    chainBase: ChainBase.Solana,
    title: 'Solana',
    isRecommended: false,
    isHidden: false,
    description:
      'Solana is a rapidly growing technology due to its speed and scale. ' +
      'Our integration with Solana allows you to create a community for your project with just a click!',
  },
];

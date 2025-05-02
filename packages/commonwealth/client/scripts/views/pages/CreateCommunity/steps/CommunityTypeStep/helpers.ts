import { ChainBase } from '@hicommonwealth/shared';
import baseImg from 'assets/img/communitySelector/base.svg';
import cosmosImg from 'assets/img/communitySelector/cosmos.svg';
import ethereumImg from 'assets/img/communitySelector/ethereum.svg';
import polygonImg from 'assets/img/communitySelector/polygon.svg';
import skaleImg from 'assets/img/communitySelector/skale.svg';
import solanaImg from 'assets/img/communitySelector/solana.svg';
import sonieumImg from 'assets/img/communitySelector/sonieum.png';
import { CommunityType } from 'views/components/component_kit/new_designs/CWCommunitySelector';

export const communityTypeOptions = [
  {
    type: CommunityType.Base,
    img: baseImg,
    chainBase: ChainBase.Ethereum,
    title: 'BASE',
    isRecommended: true,
    description:
      'Base is an Ethereum Layer 2 network with high TVL and low transaction fees',
  },
  {
    type: CommunityType.Solana,
    img: solanaImg,
    chainBase: ChainBase.Solana,
    title: 'Solana',
    isRecommended: false,
    isHidden: false,
    description:
      'Solana is a rapidly growing technology due to its speed and scale. ' +
      'Our integration with Solana allows you to create a community for your project with just a click!',
  },
  {
    type: CommunityType.Skale,
    img: skaleImg,
    chainBase: ChainBase.Ethereum,
    title: 'Skale',
    isRecommended: false,
    isHidden: false,
    description:
      // eslint-disable-next-line max-len
      'SKALE is an on-demand blockchain network with zero gas fees. ' +
      // eslint-disable-next-line max-len
      'Allowing quick deployment of interoperable EVM-compatible chains without compromising security or decentralization',
  },
  {
    type: CommunityType.Sonieum,
    img: sonieumImg,
    chainBase: ChainBase.Ethereum,
    title: 'Sonieum',
    isRecommended: false,
    description:
      'Empowering individuals and communities to collaborate, create and fill the world ' +
      'with emotion together. Powered by #Sony Block Solutions Labs.',
  },
  {
    type: CommunityType.Ethereum,
    img: ethereumImg,
    chainBase: ChainBase.Ethereum,
    title: 'Ethereum (EVM)',
    isRecommended: false,
    description:
      'Select this community type to configure to any EVM based chain ' +
      '(such as Optimism or Arbitrum) not featured above.',
  },
  {
    type: CommunityType.Cosmos,
    img: cosmosImg,
    chainBase: ChainBase.CosmosSDK,
    title: 'Cosmos',
    isRecommended: false,
    description:
      'The Cosmos Network is a decentralized network of independent, scalable, ' +
      'and interoperable blockchains, creating the foundation for a new token economy.',
  },
  {
    type: CommunityType.Polygon,
    img: polygonImg,
    chainBase: ChainBase.Ethereum,
    title: 'Polygon',
    isRecommended: false,
    description:
      'Polygon is built around making web3 technology accessible, with zero prior knowledge. ' +
      'Common supports communities on the Polygon network...',
  },
];

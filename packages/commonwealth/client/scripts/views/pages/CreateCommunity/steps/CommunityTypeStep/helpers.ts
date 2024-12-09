import { ChainBase } from '@hicommonwealth/shared';
import baseImg from 'assets/img/communitySelector/base.svg';
import blastImg from 'assets/img/communitySelector/blast.png';
import cosmosImg from 'assets/img/communitySelector/cosmos.svg';
import ethereumImg from 'assets/img/communitySelector/ethereum.svg';
import polygonImg from 'assets/img/communitySelector/polygon.svg';
import skaleImg from 'assets/img/communitySelector/skale.svg';
import solanaImg from 'assets/img/communitySelector/solana.svg';
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
    type: CommunityType.Blast,
    img: blastImg,
    chainBase: ChainBase.Ethereum,
    title: 'Blast',
    isRecommended: false,
    description:
      'Blast is an Ethereum Layer 2 network with high TVL, offering native yield, ' +
      'and secure decentralized app platform.',
  },
  {
    type: CommunityType.Ethereum,
    img: ethereumImg,
    chainBase: ChainBase.Ethereum,
    title: 'Ethereum (EVM)',
    isRecommended: false,
    description:
      'Tokens built on the ERC20 protocol are fungible, meaning they are interchangeable. ' +
      'Select this community type if you have minted a token on the Ethereum blockchain.',
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
];

import { buildEtherscanLink } from 'views/modals/ManageCommunityStakeModal/utils';

export const stakeHistoryData = [
  {
    community: {
      id: 'dydx',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'Dydx',
    },
    address: '0xAC3f2929499Ad96C683182aE470a05ea0bE41b41',
    stake: '1',
    voteWeight: '0.072 ETH',
    avgPrice: '0.036 ETH',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
  {
    community: {
      id: 'axie',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'Axie',
    },
    address: '0xAC3f2929499Ad96C683182aE470a05ea0bE41b42',
    stake: '2',
    voteWeight: '0.071 ETH',
    avgPrice: '0.039 ETH',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe1',
    ),
  },
];

export const transactionHistoryData = [
  {
    community: {
      id: 'dydx',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'DyDx',
    },
    address: '0xAC3f2929499Ad96C683182aE470a05ea0bE41b41',
    action: 'Mint',
    stake: '2',
    avgPrice: '0.036 ETH',
    totalPrice: '0.072 ETH',
    timestamp: '2024-03-13T15:36:46.215Z',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
  {
    community: {
      id: 'axie',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'Axie',
    },
    address: '0xAC3f2929499Ad96C683181aE470a05ea0bE41b41',
    action: 'Burn',
    stake: '1',
    avgPrice: '0.048 ETH',
    totalPrice: '0.048 ETH',
    timestamp: '2024-01-13T15:36:46.215Z',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
  {
    community: {
      id: 'turtle',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'Turtle Squad',
    },
    address: '0xAC3f2929499Ad99C683182aE470a05ea0bE41b41',
    action: 'Mint',
    stake: '3',
    avgPrice: '0.080 ETH',
    totalPrice: '0.240 ETH',
    timestamp: '2024-03-01T15:36:46.215Z',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
  {
    community: {
      id: 'gorilla',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'Gorilla Squad',
    },
    address: '0xAC3f2929499Bd96C683182aE470a05ea0bE41b41',
    action: 'Mint',
    stake: '5',
    avgPrice: '0.036 ETH',
    totalPrice: '0.180 ETH',
    timestamp: '2024-03-05T15:36:46.215Z',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
  {
    community: {
      id: 'ninja',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'Ninja Squad',
    },
    address: '0xAC3f2929499Ad96C693182aE470a05eq0bE41b41',
    action: 'Burn',
    stake: '2',
    avgPrice: '0.040 ETH',
    totalPrice: '0.080 ETH',
    timestamp: '2024-03-07T11:36:46.215Z',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
  {
    community: {
      id: 'dydx',
      symbol: 'ABCD',
      iconUrl:
        'https://assets.commonwealth.im/eda9d2ee-16b0-4563-a035-5abfef99ace0.jpg',
      name: 'Clove',
    },
    address: '0xACf29204199Ad96C683182aE470a05ea0bE41b41',
    action: 'Burn',
    stake: '3',
    avgPrice: '0.045 ETH',
    totalPrice: '0.135 ETH',
    timestamp: '2024-02-11T15:36:46.215Z',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
];

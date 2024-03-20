import { buildEtherscanLink } from 'client/scripts/views/modals/ManageCommunityStakeModal/utils';

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
      name: 'Comunity name',
    },
    address: '0xr407...86RJyz',
    action: 'Mint',
    stake: '2',
    avgPrice: '0.036 ETH',
    totalPrice: '0.072 ETH',
    timestamp: '3 weeks ago',
    etherscanLink: buildEtherscanLink(
      '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
    ),
  },
];

import { buildEtherscanLink } from 'client/scripts/views/modals/ManageCommunityStakeModal/utils';

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

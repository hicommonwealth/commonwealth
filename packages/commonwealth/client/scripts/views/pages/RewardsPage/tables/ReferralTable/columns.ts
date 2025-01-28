import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';

export const columns: CWTableColumnInfo[] = [
  {
    key: 'rank',
    header: 'Rank',
    numeric: false,
    sortable: false,
  },
  {
    key: 'username',
    header: 'Username',
    numeric: false,
    sortable: true,
  },
  {
    key: 'address',
    header: 'Address',
    numeric: false,
    sortable: false,
  },
  {
    key: 'earnings',
    header: 'Earnings',
    numeric: true,
    sortable: true,
    headerInfo: {
      title: 'Earnings',
      content: `This column displays your referral earnings from ETH only.

You may be accumulating earnings from other tokens such as earnings from meme contests.

Earnings in other tokens are directly displayed in your wallet.`,
    },
  },
];

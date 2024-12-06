import { GetTransactions } from '@hicommonwealth/schemas';
import { z } from 'zod';

export type FilterOptions = {
  searchText?: string;
  selectedAddress?: { label: string; value: string };
};

export type TransactionTypes = 'buy' | 'sell' | 'mint' | 'burn';

export type TransactionsProps = {
  transactions: ({
    transaction_type: TransactionTypes;
    etherscanLink: string;
    totalPrice: string;
  } & Omit<
    z.infer<typeof GetTransactions.output>[number],
    'transaction_type'
  >)[];
};

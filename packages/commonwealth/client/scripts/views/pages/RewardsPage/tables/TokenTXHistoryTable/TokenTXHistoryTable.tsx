import React from 'react';

import { TransactionsTab } from 'views/components/Profile/ProfileActivity/TransactionsTab';
import './TokenTXHistoryTable.scss';

export const TokenTXHistoryTable = () => {
  return (
    <div className="TokenTXHistoryTable">
      <TransactionsTab transactionsType="history" />
    </div>
  );
};

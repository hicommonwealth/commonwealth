import { GetLaunchpadTrades } from '@hicommonwealth/schemas';
import React from 'react';

import { TransactionsTab } from 'views/components/Profile/ProfileActivity/TransactionsTab';
import { z } from 'zod';
import './TokenTXHistoryTable.scss';

type GetLaunchpadTradesOutput = z.infer<typeof GetLaunchpadTrades.output>;

type TokenTXHistoryTableProps = {
  trades?: GetLaunchpadTradesOutput;
  isLoading: boolean;
};

export const TokenTXHistoryTable = ({ trades }: TokenTXHistoryTableProps) => {
  return (
    <div className="TokenTXHistoryTable">
      <TransactionsTab
        transactionsType="history"
        prefetchedData={trades}
        showFilterOptions={false}
      />
    </div>
  );
};

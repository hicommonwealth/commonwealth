import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import app from 'client/scripts/state';
import { TransactionsTab } from 'client/scripts/views/components/Profile/ProfileActivity/TransactionsTab';
import './CommunityTransactions.scss';

const CommunityTransactions = () => {
  const community = app.chain ? app.chain?.meta?.name : null;

  return (
    <div className="CommunityTransactions">
      <div className="heading-container">
        <CWText type="h2">Transactions</CWText>
      </div>
      <TransactionsTab
        transactionsType="history"
        showFilterOptions={false}
        searchText={community ? community : ''}
      />
    </div>
  );
};

export default CommunityTransactions;

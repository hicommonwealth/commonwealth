import React from 'react';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { TransactionsTab } from '../../components/Profile/ProfileActivity/TransactionsTab/TransactionsTab';
import { CWText } from '../../components/component_kit/cw_text';
import { PageNotFound } from '../404';
import './MyTransactions.scss';

const MyTransactions = () => {
  const user = useUserStore();

  if (!user.isLoggedIn) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="MyTransactions">
        <div className="title-and-wallet-button">
          <CWText type="h2" className="header">
            My Transactions
          </CWText>
        </div>

        <TransactionsTab transactionsType="history" />
      </section>
    </CWPageLayout>
  );
};

export { MyTransactions };

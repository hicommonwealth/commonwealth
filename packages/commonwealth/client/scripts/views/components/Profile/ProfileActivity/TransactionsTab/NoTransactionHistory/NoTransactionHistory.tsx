import noTransactionHistory from 'assets/img/noTransactionHistory.svg';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './NoTransactionHistory.scss';

type NoTransactionHistoryProps = {
  withSelectedAddress?: boolean;
};

const NoTransactionHistory = ({
  withSelectedAddress = false,
}: NoTransactionHistoryProps = {}) => {
  const navigate = useCommonNavigate();
  return (
    <section className="NoTransactionHistory">
      <div className="container">
        <img src={noTransactionHistory} alt="no transaction history icon" />
        <div className="labels">
          <CWText type="h4" fontWeight="semiBold">
            You have not purchased assets in any communities{' '}
            {withSelectedAddress ? 'with the selected address' : ''}
          </CWText>
        </div>
        <CWButton
          label="Explore"
          buttonWidth="full"
          onClick={() => navigate('/explore', {}, null)}
        />
      </div>
    </section>
  );
};

export default NoTransactionHistory;

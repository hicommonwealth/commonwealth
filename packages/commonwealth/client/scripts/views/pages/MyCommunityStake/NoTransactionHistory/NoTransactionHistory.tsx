import noTransactionHistory from 'assets/img/noTransactionHistory.svg';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './NoTransactionHistory.scss';

const NoTransactionHistory = () => {
  const navigate = useCommonNavigate();

  return (
    <section className="NoTransactionHistory">
      <div className="container">
        <img src={noTransactionHistory} alt="no transaction history icon" />
        <div className="labels">
          <CWText type="h4" fontWeight="semiBold">
            You have not purchased stake in any communities
          </CWText>
          <CWText type="b1">
            <span>
              Purchasing community stake gives you more upvote power within your
              communities.{' '}
              <a href="https://blog.commonwealth.im/community-stake-100-owners-around-any-idea/">
                Learn more
              </a>
            </span>
          </CWText>
        </div>
        <CWButton
          label="Explore communities"
          buttonWidth="full"
          onClick={() => navigate('/communities')}
        />
      </div>
    </section>
  );
};

export default NoTransactionHistory;

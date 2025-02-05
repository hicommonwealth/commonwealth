import React, { useState } from 'react';
import FractionalValue from 'views/components/FractionalValue';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import RewardsCard from '../../RewardsCard';
import './WalletCard.scss';

enum WalletBalanceTabs {
  Tokens = 'Tokens',
  Staked = 'Staked',
}

const sampleTokens = [
  {
    name: 'Common',
    price: 1231,
  },
  {
    name: 'ETH',
    price: 50,
  },
  {
    name: 'Sushi',
    price: 32,
  },
];

const WalletCard = () => {
  const [activeTab, setActiveTab] = useState<WalletBalanceTabs>(
    WalletBalanceTabs.Tokens,
  );

  return (
    <RewardsCard title="Wallet Balance" icon="cardholder">
      <div className="WalletCard">
        <CWTabsRow>
          {Object.values(WalletBalanceTabs).map((tab) => (
            <CWTab
              key={tab}
              label={tab}
              isSelected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </CWTabsRow>
        <div className="list">
          {sampleTokens.map((token) => (
            <div className="balance-row" key={token.name}>
              <CWText>{token.name}</CWText>
              <FractionalValue value={token.price} />
            </div>
          ))}
        </div>
      </div>
    </RewardsCard>
  );
};

export default WalletCard;

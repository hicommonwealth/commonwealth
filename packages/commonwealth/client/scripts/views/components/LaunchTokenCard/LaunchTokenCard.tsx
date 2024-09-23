import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import TokenLaunchButton from '../sidebar/TokenLaunchButton';
import './LaunchTokenCard.scss';

const LaunchTokenCard = () => {
  return (
    <section className="LaunchTokenCard">
      <CWText type="h2" fontWeight="bold" isCentered>
        Launch a token
        <br />
        right on common!
      </CWText>
      <CWText fontWeight="semiBold" isCentered>
        No developers or technical skills required. Easily crowdfund liquidity.
        Auto-launch on Uniswap when market cap is reached.
      </CWText>
      <TokenLaunchButton />
    </section>
  );
};

export default LaunchTokenCard;

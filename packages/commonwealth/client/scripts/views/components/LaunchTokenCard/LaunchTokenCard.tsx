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
      <CWText isCentered>
        1. Add an image and a name
        <br />
        2. Share the link
        <br />
        3. Hit the fundraise target
      </CWText>
      <TokenLaunchButton />
    </section>
  );
};

export default LaunchTokenCard;

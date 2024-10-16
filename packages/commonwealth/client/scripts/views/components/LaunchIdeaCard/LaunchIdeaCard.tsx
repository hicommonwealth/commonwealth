import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWTextInput } from '../component_kit/new_designs/CWTextInput';
import TokenLaunchButton from '../sidebar/TokenLaunchButton';
import './LaunchIdeaCard.scss';

type LaunchIdeaCardProps = {
  onTokenLaunchClick?: () => void;
  onRandomizeClick?: () => void;
};

const LaunchIdeaCard = ({
  onTokenLaunchClick,
  onRandomizeClick,
}: LaunchIdeaCardProps) => {
  return (
    <section className="LaunchIdeaCard">
      <div className="gradiant-container">
        <CWText type="h3">Launch an idea</CWText>
        <CWTextInput
          placeholder="Type your idea or select randomize to launch a token...."
          fullWidth
        />
        <div className="cta-elements">
          <CWText className="randomize-cta-text">
            Try our randomizer button to launch tokens fast!
          </CWText>
          <span className="ml-auto" />
          <CWButton
            iconLeft="brain"
            label="Randomize"
            onClick={onRandomizeClick}
          />
          <TokenLaunchButton buttonWidth="wide" onClick={onTokenLaunchClick} />
        </div>
      </div>
    </section>
  );
};

export default LaunchIdeaCard;

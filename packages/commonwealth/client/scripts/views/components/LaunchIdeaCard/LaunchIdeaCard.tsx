import { VALIDATION_MESSAGES } from 'helpers/formValidations/messages';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWTextInput } from '../component_kit/new_designs/CWTextInput';
import TokenLaunchButton from '../sidebar/TokenLaunchButton';
import './LaunchIdeaCard.scss';

type LaunchIdeaCardProps = {
  onTokenLaunchClick?: () => void;
  onRandomizeClick?: (ideaPrompt?: string) => void;
  maxPromptLength?: number;
  ideaPrompt: string;
  onIdeaPromptChange: (newPrompt: string) => void;
};

const LaunchIdeaCard = ({
  onTokenLaunchClick,
  onRandomizeClick,
  maxPromptLength = 80,
  ideaPrompt,
  onIdeaPromptChange,
}: LaunchIdeaCardProps) => {
  const maxCharLimitReached = maxPromptLength === (ideaPrompt || '').length;

  return (
    <section className="LaunchIdeaCard">
      <div className="gradiant-container">
        <CWText type="h3">Launch an idea</CWText>
        <CWTextInput
          placeholder="Type your idea or select randomize to launch a token...."
          fullWidth
          value={ideaPrompt}
          onInput={(e) =>
            !maxCharLimitReached && onIdeaPromptChange(e.target.value)
          }
          customError={
            maxCharLimitReached
              ? VALIDATION_MESSAGES.MAX_CHAR_LIMIT_REACHED
              : ''
          }
        />
        <div className="cta-elements">
          <CWText className="randomize-cta-text">
            Try our randomizer button to launch tokens fast!
          </CWText>
          <span className="ml-auto" />
          <div className="buttons">
            <CWButton
              className="responsive-cw-button"
              iconLeft="brain"
              label="Randomize"
              onClick={() => onRandomizeClick?.(ideaPrompt)}
            />
            <TokenLaunchButton
              buttonWidth="wide"
              onClick={onTokenLaunchClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LaunchIdeaCard;

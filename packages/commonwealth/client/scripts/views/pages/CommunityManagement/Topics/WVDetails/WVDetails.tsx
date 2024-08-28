import React, { useState } from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CreateTopicStep } from '../utils';
import './WVDetails.scss';

interface WVConsentProps {
  onStepChange: (step: CreateTopicStep) => void;
}

const WVDetails = ({ onStepChange }: WVConsentProps) => {
  const navigate = useCommonNavigate();
  const [multiplier, setMultiplier] = useState(1);
  const options = [{ label: 'BASE', value: 1 }];

  return (
    <div className="WVDetails">
      <CWText type="h2">Weighted voting</CWText>
      <CWText type="b1" className="description">
        Activate weighted voting to allow members to cast votes proportional to
        their stake or contribution, ensuring decisions reflect the
        community&apos;s investment levels.
      </CWText>

      <CWDivider />

      <CWText type="h4">Connect ERC20 token</CWText>

      <CWText type="h5">Supported chains</CWText>
      <CWText type="b1" className="description">
        The following are the pre-selected chain(s) all token features will be
        interacting with.
      </CWText>
      <CWSelectList
        options={options}
        defaultValue={options[0]}
        isSearchable={false}
      />

      <CWText type="h5">Primary token</CWText>
      <CWText type="b1" className="description">
        Any token features such as voting or tipping require your community to
        connect a primary token.
      </CWText>
      <CWTextInput fullWidth placeholder="Please enter primary token" />

      <CWText type="h5">Vote weight multiplier</CWText>

      <div className="input-row">
        <CWText type="b1" className="description">
          1 token is equal to
        </CWText>
        <CWTextInput
          type="number"
          min={1}
          defaultValue={1}
          isCompact
          value={multiplier}
          onInput={(e) => setMultiplier(e.target.value)}
        />
        <CWText type="b1" className="description">
          votes.
        </CWText>
      </div>
      <CWText type="b1" className="description">
        Vote weight per token held by the user will be {multiplier}.
      </CWText>

      <CWText className="info" fontWeight="medium">
        Not sure?
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://docs.common.xyz/commonwealth"
        >
          Learn more about weighted voting
        </a>
      </CWText>

      <CWDivider />

      <section className="action-buttons">
        <CWButton
          type="button"
          label="Back"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={() => onStepChange(CreateTopicStep.WVConsent)}
        />
        <CWButton
          type="button"
          buttonWidth="wide"
          label="Enable weighted voting for topic"
          onClick={() => navigate('/discussions')}
        />
      </section>
    </div>
  );
};
export default WVDetails;

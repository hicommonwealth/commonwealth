import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import { CreateTopicStep } from '../utils';

import './WVConsent.scss';

interface WVConsentProps {
  onStepChange: (step: CreateTopicStep) => void;
  topicName: string;
}

const WVConsent = ({ onStepChange, topicName }: WVConsentProps) => {
  const navigate = useCommonNavigate();

  return (
    <div className="WVConsent">
      <section className="header">
        <CWText type="h2">Weighted voting</CWText>
        <CWText type="b1" className="description">
          Activate weighted voting to allow members to cast votes proportional
          to their stake or contribution, ensuring decisions reflect the
          community&apos;s investment levels.
        </CWText>

        <CWText type="h4">
          Do you want to enable weighted voting for this topic?
        </CWText>

        <CWText type="b1" className="description">
          Activate weighted voting to allow members to cast votes proportional
          to their stake or contribution, ensuring decisions reflect the
          community&apos;s investment levels. This feature is designed to
          provide a more representative voting system based on member engagement
          and contributions.
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
            label="Skip"
            buttonWidth="wide"
            buttonType="secondary"
            onClick={() =>
              navigate(`/discussions/${encodeURI(topicName.trim())}`)
            }
          />
          <CWButton
            type="button"
            buttonWidth="wide"
            label="Yes"
            onClick={() => onStepChange(CreateTopicStep.WVMethodSelection)}
          />
        </section>
      </section>
    </div>
  );
};
export default WVConsent;

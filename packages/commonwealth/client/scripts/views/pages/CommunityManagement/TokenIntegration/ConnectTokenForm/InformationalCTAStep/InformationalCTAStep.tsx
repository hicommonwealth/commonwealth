import React from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './InformationalCTAStep.scss';

type InformationalCTAStepProps = {
  onConnect: () => void;
  onCancel: () => void;
};

const InformationalCTAStep = ({
  onConnect,
  onCancel,
}: InformationalCTAStepProps) => {
  return (
    <section className="InformationalCTAStep">
      <CWText type="h4">Do you want to connect an existing token?</CWText>
      <CWText className="description">
        {/* TODO: 9898 - proper copy for this */}
        Something about connecting an existing token and enabling token
        features.
      </CWText>
      <CWText type="b1" fontWeight="semiBold" className="cta-link-container">
        Not sure?&nbsp;
        <a
          href="#" // TODO: 9898 - add link
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more about token connection.
        </a>
      </CWText>
      <CWDivider />
      <section className="action-buttons">
        <CWButton
          type="button"
          label="Back"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={onCancel}
        />
        <CWButton
          type="button"
          label="Connect token"
          buttonWidth="wide"
          onClick={onConnect}
        />
      </section>
    </section>
  );
};

export default InformationalCTAStep;

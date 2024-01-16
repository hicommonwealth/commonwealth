import React from 'react';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import './Integrations.scss';

const Integrations = () => {
  return (
    <section className="Integrations">
      <section className="left-section">
        <div className="header">
          <CWText type="h2">Integrations</CWText>
          <CWText type="b1">
            Connect your apps to manage your community across channels
          </CWText>
        </div>
      </section>

      <section className="right-section">
        <FeatureHint
          title="Everything in one place"
          hint={`
          You can link to your projects custom terms of service page. 
          You can also contact us to create a custom URL that points to your Common community.
        `}
        />
      </section>
    </section>
  );
};

export default Integrations;

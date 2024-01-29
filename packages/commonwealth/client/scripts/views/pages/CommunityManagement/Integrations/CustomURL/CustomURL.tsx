import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './CustomURL.scss';

const CustomURL = () => {
  return (
    <section className="CustomURL">
      <div className="header">
        <CWText type="h4">Custom URL</CWText>
        <CWText type="b1">
          You can create a custom URL to direct to your community. Our support
          team can walk you through this process.
        </CWText>
      </div>

      <CWTextInput
        label="Custom URL"
        placeholder="https://"
        disabled
        fullWidth
      />

      <CWText type="b1">
        Email support at:&nbsp;
        <a href="mailto:support@common.xyz">support@common.xyz</a>
      </CWText>
    </section>
  );
};

export default CustomURL;

import React from 'react';

import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';

import './ContestThreadBanner.scss';

interface ContestThreadBannerProps {
  submitEntryChecked: boolean;
  onSetSubmitEntryChecked: (value: boolean) => void;
}

const ContestThreadBanner = ({
  submitEntryChecked,
  onSetSubmitEntryChecked,
}: ContestThreadBannerProps) => {
  return (
    <CWBanner
      className="ContestThreadBanner"
      title="This topic has an ongoing contest. Submit thread to contest?"
      body="Once a post is submitted it cannot be edited.
      The post with the most upvotes will win the contest prize."
      type="info"
      accessoryRight={
        <div className="banner-accessory-right">
          <CWText type="caption">Submit Entry</CWText>
          <CWCheckbox
            checked={submitEntryChecked}
            onChange={() => onSetSubmitEntryChecked(!submitEntryChecked)}
          />
        </div>
      }
      footer={
        <a
          href="https://blog.commonwealth.im"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more about contests
        </a>
      }
    />
  );
};

export default ContestThreadBanner;

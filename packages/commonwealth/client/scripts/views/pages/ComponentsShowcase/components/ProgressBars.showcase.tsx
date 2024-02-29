import React from 'react';
import { CWProgressBar } from 'views/components/component_kit/cw_progress_bar';

const ProgressBarsShowcase = () => {
  return (
    <>
      <CWProgressBar
        progress={75}
        label="Progress Bar (Success)"
        progressStatus="passed"
      />
      <CWProgressBar
        progress={75}
        label="Progress Bar (Success) with Check"
        progressStatus="passed"
        iconName="check"
      />
      <CWProgressBar
        progress={100}
        label="Progress Bar (Selected)"
        progressStatus="selected"
      />
      <CWProgressBar
        progress={150}
        label="Progress Bar (Neutral) With Token"
        progressStatus="neutral"
        subtext="50 CMN"
      />
      <CWProgressBar
        progress={75}
        label="Progress Bar (Ongoing) With Token"
        progressStatus="ongoing"
        subtext="50 CMN"
      />
    </>
  );
};

export default ProgressBarsShowcase;

import 'components/user_survey_popup.scss';
import React from 'react';
import app from 'state';

import { CWButton } from './component_kit/cw_button';
import { CWCheckbox } from './component_kit/cw_checkbox';
import { CWGrowl } from './component_kit/cw_growl';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CWText } from './component_kit/cw_text';

const USER_SURVEY_DISPLAY_INTERVAL = 1000 * 60 * 60; // 1 Hour wait

type UserSurveyViewProps = {
  disabled: boolean;
  checked: boolean;
  onRedirectClick: () => void;
  onClose: () => void;
  onCheckboxClick: () => void;
};

const UserSurveyView = (props: UserSurveyViewProps) => {
  const { disabled, checked, onRedirectClick, onClose, onCheckboxClick } =
    props;

  return (
    <CWGrowl position="bottom-right" disabled={disabled}>
      <div className="UserSurveyPopup">
        <div className="survey-svg-header"></div>
        <CWIcon iconName="close" className="close-icon" onClick={onClose} />
        <CWText type="h3" fontWeight="bold" className="header-text">
          Want a Milk Carton NFT?
        </CWText>
        <CWText type="b1" className="body-text">
          Take a quick survey to help us improve Common and get a special NFT
          dropped to your ETH address!
        </CWText>
        <div className="button-wrapper">
          <CWButton
            buttonType="secondary-black"
            label="No Thanks"
            onClick={onClose}
          />
          <CWButton
            buttonType="primary-black"
            label="Sure Thing!"
            onClick={onRedirectClick}
          />
        </div>
        <CWCheckbox
          value=""
          checked={checked}
          label="Please don't show this again"
          onChange={onCheckboxClick}
          className="checkbox"
        />
      </div>
    </CWGrowl>
  );
};

function surveyDisplayTimeElapsed() {
  const lastSurvey = localStorage.getItem('user-survey-last-displayed');
  if (!lastSurvey) {
    // They have never seen the survey growl before
    return true;
  }
  const lastSurveyDate = new Date(parseInt(lastSurvey, 10));
  const now = new Date();

  const timeSinceLastSurvey = now.getTime() - lastSurveyDate.getTime();
  return timeSinceLastSurvey > USER_SURVEY_DISPLAY_INTERVAL;
}

const openTypeform = (
  typeformBaseUrl: string,
  params: { [param: string]: string }
) => {
  let paramsString = '';
  Object.keys(params).forEach((key, i) => {
    if (i > 0) {
      paramsString += '&';
    } else {
      paramsString += '#';
    }
    paramsString += `${key}=${params[key]}`;
  });

  window.open(`${typeformBaseUrl}${paramsString}`, '_blank');
};

type UserSurveyPopupProps = {
  surveyReadyForDisplay: boolean;
};

export const UserSurveyPopup = (props: UserSurveyPopupProps) => {
  const { surveyReadyForDisplay } = props;

  const [surveyLocked, setSurveyLocked] = React.useState<boolean>(
    !!localStorage.getItem('user-survey-locked') || !surveyDisplayTimeElapsed()
  );
  const [hideForeverChecked, setHideForeverChecked] =
    React.useState<boolean>(false); // radio button indicating whether the user wants to hide the survey forever

  const handleClose = () => {
    if (hideForeverChecked) {
      localStorage.setItem('user-survey-locked', 'true');
    }
    setSurveyLocked(true);
    localStorage.setItem('user-survey-last-displayed', Date.now().toString());
    console.log('setting new survey-last-displayed');
  };

  const handleRedirect = () => {
    const address =
      app.user.activeAccount?.address ?? app.user.addresses[0].address;
    const name = app.user.activeAccount?.profile.name ?? 'there';

    openTypeform('https://hicommonwealth.typeform.com/to/dS5q7cM2', {
      address,
      name,
    });

    // We don't need to display it to this user again
    setSurveyLocked(true);
    localStorage.setItem('user-survey-locked', 'true');
  };

  const hasAnAddress =
    (app.user.activeAccount?.address ?? app.user.addresses[0]?.address) !==
    undefined;

  return (
    <UserSurveyView
      disabled={
        !surveyReadyForDisplay ||
        surveyLocked ||
        !app.isLoggedIn() ||
        !hasAnAddress
      }
      checked={hideForeverChecked}
      onRedirectClick={handleRedirect}
      onClose={handleClose}
      onCheckboxClick={() => {
        setHideForeverChecked(!hideForeverChecked);
      }}
    />
  );
};

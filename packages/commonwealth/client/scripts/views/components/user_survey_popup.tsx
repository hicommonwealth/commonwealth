/* @jsx m */

import m from 'mithril';
import app from 'state';

import 'components/user_survey_popup.scss';

import { CWButton } from './component_kit/cw_button';
import { CWCheckbox } from './component_kit/cw_checkbox';
import { CWGrowl } from './component_kit/cw_growl';
import { CWText } from './component_kit/cw_text';

const USER_SURVEY_DISPLAY_INTERVAL = 1000 * 60 * 1; // Wait one day before showing it again (if they didn't click "never show again")

type UserSurveyViewAttrs = {
  disabled: boolean;
  checked: boolean;
  onRedirectClick: () => void;
  onClose: () => void;
  onCheckboxClick: () => void;
};
class UserSurveyView implements m.ClassComponent<UserSurveyViewAttrs> {
  view(vnode) {
    const { disabled, checked, onRedirectClick, onClose, onCheckboxClick } =
      vnode.attrs;
    return (
      <CWGrowl position="bottom-right" disabled={disabled}>
        <div class="UserSurveyPopup">
          <CWButton label="redirect" onclick={onRedirectClick}></CWButton>

          <CWButton label="close" onclick={onClose}></CWButton>
          <CWButton
            label="reset all"
            onclick={() => {
              localStorage.deleteItem('user-survey-locked');
            }}
          ></CWButton>
          <CWText type="caption">{`checkbox: ${checked}`}</CWText>

          <CWCheckbox
            checked={checked}
            label="hide forev"
            onchange={onCheckboxClick}
          />
        </div>
      </CWGrowl>
    );
  }
}

type UserSurveyPopupAttrs = {
  redirectLink: string;
};

function surveyDisplayTimeElapsed() {
  const lastSurvey = localStorage.getItem('user-survey-last-displayed');
  if (!lastSurvey) {
    // They have never seen the survey before
    return true;
  }
  const lastSurveyDate = new Date(parseInt(lastSurvey, 10));
  const now = new Date();

  const timeSinceLastSurvey = now.getTime() - lastSurveyDate.getTime();
  console.log('timeSinceLastSurvey', timeSinceLastSurvey);
  return timeSinceLastSurvey > USER_SURVEY_DISPLAY_INTERVAL;
}

export class UserSurveyPopup implements m.ClassComponent<UserSurveyPopupAttrs> {
  private surveyLocked: boolean;
  private surveyReadyForDisplay: boolean;
  private surveyDelayTriggered: boolean;
  private hideForeverChecked: boolean; // radio button indicating whether the user wants to hide the survey forever

  oncreate() {
    this.hideForeverChecked = false;
    const surveyCurrentlyLocked = localStorage.getItem('user-survey-locked');
    const surveyTimeElapsed = surveyDisplayTimeElapsed();
    this.surveyReadyForDisplay = true;

    if (surveyCurrentlyLocked) {
      this.surveyLocked = true;
    } else {
      if (surveyTimeElapsed) {
        this.surveyLocked = false;
        console.log('setting new survey last displayed');
      } else {
        this.surveyLocked = true;
      }
    }
  }

  // survey currently locked -> means they clicked teh button, so this.surveyLocked = true
  // survey not locked -> surveyTimeElapsed (or no time found) -> means they have waited long enough, so this.surveyLocked = false
  // survey not locked -> !surveyTimeElapsed -> means they have seen it, closed it, and it hasnt been long enough, so this.surveyLocked = true

  view(vnode) {
    const { redirectLink } = vnode.attrs;
    const handleClose = () => {
      if (this.hideForeverChecked) {
        localStorage.setItem('user-survey-locked', 'true');
      }
      this.surveyLocked = true;
      localStorage.setItem('user-survey-last-displayed', Date.now().toString());
      m.redraw();
    };

    // Trigger a delay before showing the survey growl
    // if (
    //   !this.surveyDelayTriggered &&
    //   app.isLoggedIn() &&
    //   !this.surveyReadyForDisplay
    // ) {
    //   this.surveyDelayTriggered = true;
    //   setTimeout(() => {
    //     this.surveyReadyForDisplay = true;
    //   }, 10);
    // }

    return (
      <UserSurveyView
        disabled={
          !this.surveyReadyForDisplay || this.surveyLocked || !app.isLoggedIn()
        }
        checked={this.hideForeverChecked}
        onRedirectClick={() => window.open(redirectLink, '_blank')}
        onClose={handleClose}
        onCheckboxClick={() => {
          this.hideForeverChecked = !this.hideForeverChecked;
          m.redraw();
        }}
      />
    );
  }
}

/* @jsx m */

import m from 'mithril';
import app from 'state';

import { CWButton } from './component_kit/cw_button';
import { CWCheckbox } from './component_kit/cw_checkbox';
import { CWGrowl } from './component_kit/cw_growl';
import { CWText } from './component_kit/cw_text';

type UserSurveyPopupAttrs = {
  redirectLink: string;
};

export class UserSurveyPopup implements m.ClassComponent<UserSurveyPopupAttrs> {
  private surveyLocked: boolean;
  private surveyReadyForDisplay: boolean;
  private surveyDelayTriggered: boolean;
  private hideForeverChecked: boolean; // radio button indicating whether the user wants to hide the survey forever

  oncreate() {
    this.hideForeverChecked = false;

    const surveyStatus = localStorage.getItem('user-survey-locked');
    this.surveyReadyForDisplay = true;
    if (!surveyStatus) {
      localStorage.setItem('user-survey-locked', 'false');
      this.surveyLocked = false;
    } else if (surveyStatus === 'false') {
      this.surveyLocked = false;
    } else {
      this.surveyLocked = true;
    }
  }

  onupdate() {
    console.log('(onupdate) checkbox:', this.hideForeverChecked);
  }

  view(vnode) {
    const { redirectLink } = vnode.attrs;
    const handleClose = () => {
      if (this.hideForeverChecked) {
        localStorage.setItem('user-survey-locked', 'true');
      }
      this.surveyLocked = true;
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

    console.log('(in the view) checkbox:', this.hideForeverChecked);

    return (
      <CWGrowl
        position="bottom-left"
        disabled={
          !this.surveyReadyForDisplay || this.surveyLocked || !app.isLoggedIn()
        }
      >
        <div class="UserSurveyPopup">
          <CWButton
            label="redirect"
            onclick={() => window.open(redirectLink, '_blank')}
          ></CWButton>

          <CWButton label="close" onclick={handleClose}></CWButton>
          <CWButton
            label="reset all"
            onclick={() => {
              localStorage.deleteItem('user-survey-locked');
            }}
          ></CWButton>
          <CWText type="caption">{`checkbox: ${this.hideForeverChecked}`}</CWText>

          <CWCheckbox
            checked={this.hideForeverChecked}
            label="hide forev"
            onchange={() => {
              this.hideForeverChecked = !this.hideForeverChecked;
              m.redraw();
            }}
          />
        </div>
      </CWGrowl>
    );
  }
}

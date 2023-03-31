/* @jsx m */

import ClassComponent from 'class_component';

import 'components/profile_growl.scss';
import m from 'mithril';
import app from 'state';

import { CWButton } from './component_kit/cw_button';
import { CWCheckbox } from './component_kit/cw_checkbox';
import { CWGrowl } from './component_kit/cw_growl';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CWText } from './component_kit/cw_text';

const GROWL_DISPLAY_INTERVAL = 1000 * 60 * 60; // 1 Hour wait

type EmailDigestGrowlViewAttrs = {
  disabled: boolean;
  checked: boolean;
  onRedirectClick: () => void;
  onClose: () => void;
  onCheckboxClick: () => void;
};

class EmailDigestView extends ClassComponent<EmailDigestGrowlViewAttrs> {
  view(vnode: m.Vnode<EmailDigestGrowlViewAttrs>) {
    const { disabled, checked, onRedirectClick, onClose, onCheckboxClick } =
      vnode.attrs;
    return (
      <CWGrowl position="bottom-right" disabled={disabled}>
        <div class="ProfileGrowlPopup">
          <div class="survey-svg-header"></div>
          <CWIcon iconName="close" className="close-icon" onclick={onClose} />
          <CWText type="h3" fontWeight="bold" className="header-text">
            Stay in the know via email
          </CWText>
          <CWText type="b1" className="body-text">
            Bundle top posts from all your communities via email as often as you
            need it.
          </CWText>
          <div class="button-wrapper">
            <CWButton
              buttonType="primary-black"
              label="Opt in"
              onclick={onRedirectClick}
            />
          </div>
          <CWCheckbox
            value=""
            checked={checked}
            label="Please don't show this again"
            onchange={onCheckboxClick}
            className="checkbox"
          />
        </div>
      </CWGrowl>
    );
  }
}

function surveyDisplayTimeElapsed() {
  const lastSurvey = localStorage.getItem('email-growl-last-displayed');
  if (!lastSurvey) {
    // They have never seen the survey growl before
    return true;
  }
  const lastSurveyDate = new Date(parseInt(lastSurvey, 10));
  const now = new Date();

  const timeSinceLastSurvey = now.getTime() - lastSurveyDate.getTime();
  return timeSinceLastSurvey > GROWL_DISPLAY_INTERVAL;
}

type NewProfilesPopupAttrs = {
  readyForDisplay: boolean;
};

export class EmailDigestPopup extends ClassComponent<NewProfilesPopupAttrs> {
  private growlLocked: boolean;
  private hideForeverChecked: boolean; // radio button indicating whether the user wants to hide the survey forever

  oninit() {
    this.hideForeverChecked = false;
    const emailGrowlCurrentlyLocked =
      localStorage.getItem('email-growl-locked');
    const delayTimeElapsed = surveyDisplayTimeElapsed();

    if (emailGrowlCurrentlyLocked) {
      this.growlLocked = true;
    } else {
      this.growlLocked = !delayTimeElapsed;
    }
  }

  view(vnode: m.Vnode<NewProfilesPopupAttrs>) {
    const { readyForDisplay } = vnode.attrs;

    const handleClose = () => {
      if (this.hideForeverChecked) {
        localStorage.setItem('email-growl-locked', 'true');
      }
      this.growlLocked = true;
      localStorage.setItem('email-growl-last-displayed', Date.now().toString());
      console.log('setting new email-growl-last-displayed');
      m.redraw();
    };

    const handleRedirect = () => {
      // We don't need to display it to this user again
      this.growlLocked = true;
      localStorage.setItem('email-growl-locked', 'true');

      // Redirect to the notification page
      m.route.set(`/notification-settings`);
    };

    if (this.growlLocked) return;

    return (
      <EmailDigestView
        disabled={!readyForDisplay || this.growlLocked || !app.isLoggedIn()}
        checked={this.hideForeverChecked}
        onRedirectClick={handleRedirect}
        onClose={handleClose}
        onCheckboxClick={() => {
          this.hideForeverChecked = !this.hideForeverChecked;
        }}
      />
    );
  }
}

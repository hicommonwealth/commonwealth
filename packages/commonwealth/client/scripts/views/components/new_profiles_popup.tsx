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

type ProfileGrowlViewAttrs = {
  disabled: boolean;
  checked: boolean;
  onRedirectClick: () => void;
  onClose: () => void;
  onCheckboxClick: () => void;
};

class UserSurveyView extends ClassComponent<ProfileGrowlViewAttrs> {
  view(vnode: m.Vnode<ProfileGrowlViewAttrs>) {
    const { disabled, checked, onRedirectClick, onClose, onCheckboxClick } =
      vnode.attrs;
    return (
      <CWGrowl position="bottom-right" disabled={disabled}>
        <div class="ProfileGrowlPopup">
          <div class="survey-svg-header"></div>
          <CWIcon iconName="close" className="close-icon" onclick={onClose} />
          <CWText type="h3" fontWeight="bold" className="header-text">
            Introducing Unified Profiles
          </CWText>
          <CWText type="b1" className="body-text">
            One display name for all communities. Enjoy personalized pages and
            activity history.
          </CWText>
          <div class="button-wrapper">
            <CWButton
              buttonType="primary-black"
              label="View profile"
              onclick={onRedirectClick}
            />
          </div>
          <div class="learn-more">
            <CWText
              className="blue-text"
              onclick={() => {
                window.open(
                  'https://commonwealth.ghost.io/p/7f623d2d-3926-4db5-b154-b36c545c5baf/',
                  '_blank'
                );
              }}
            >
              Learn more
            </CWText>
            <CWIcon iconName="blueExternalLink" iconSize="small" />
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
  const lastSurvey = localStorage.getItem('profile-growl-last-displayed');
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

export class NewProfilesPopup extends ClassComponent<NewProfilesPopupAttrs> {
  private growlLocked: boolean;
  private hideForeverChecked: boolean; // radio button indicating whether the user wants to hide the survey forever

  oninit() {
    this.hideForeverChecked = false;
    const profileGrowlCurrentlyLocked = localStorage.getItem(
      'profile-growl-locked'
    );
    const delayTimeElapsed = surveyDisplayTimeElapsed();

    if (profileGrowlCurrentlyLocked) {
      this.growlLocked = true;
    } else {
      this.growlLocked = !delayTimeElapsed;
    }
  }

  view(vnode: m.Vnode<NewProfilesPopupAttrs>) {
    const { readyForDisplay } = vnode.attrs;

    const handleClose = () => {
      if (this.hideForeverChecked) {
        localStorage.setItem('profile-growl-locked', 'true');
      }
      this.growlLocked = true;
      localStorage.setItem(
        'profile-growl-last-displayed',
        Date.now().toString()
      );
      console.log('setting new profile-growl-last-displayed');
      m.redraw();
    };

    const handleRedirect = () => {
      // We don't need to display it to this user again
      this.growlLocked = true;
      localStorage.setItem('profile-growl-locked', 'true');

      const { address, chain } = app.user.addresses[0];
      const pf = app.newProfiles.getProfile(chain.id, address);

      // Redirect to the view profile page
      if (pf) {
        m.route.set(`/profile/id/${pf.id}`);
      }
    };

    if (this.growlLocked) return;

    return (
      <UserSurveyView
        disabled={!readyForDisplay || this.growlLocked || !app.isLoggedIn()}
        disabled={false}
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

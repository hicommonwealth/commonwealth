/* @jsx m */

import m from 'mithril';
import { CWButton } from './component_kit/cw_button';
import { CWGrowl } from './component_kit/cw_growl';
import { CWRadioButton } from './component_kit/cw_radio_button';

type UserSurveyPopupAttrs = {
  onclose: () => void;
};

export class UserSurveyPopup implements m.ClassComponent<UserSurveyPopupAttrs> {
  private hideForeverChecked;
  view(vnode) {
    const { onclose } = vnode.attrs;
    const handleClose = () => {
      if (this.hideForeverChecked) {
        localStorage.setItem('user-survey-locked', 'true');
        onclose();
      } else {
        onclose();
      }
    };
    return (
      <CWGrowl position="bottom-right">
        <div class="UserSurveyPopup">
          <CWButton label="redirect"></CWButton>

          <CWButton label="close" onclick={handleClose}></CWButton>
          <CWButton
            label="reset all"
            onclick={() => {
              localStorage.deleteItem('user-survey-locked');
            }}
          ></CWButton>

          <CWRadioButton
            label="check"
            checked={this.hideForeverChecked}
            onchange={() => {
              this.hideForeverChecked = !this.hideForeverChecked;
            }}
          ></CWRadioButton>
        </div>
      </CWGrowl>
    );
  }
}

/* @jsx m */

import ClassComponent from 'class_component';
import { parseCustomStages, threadStageToLabel } from 'helpers';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import $ from 'jquery';
import m from 'mithril';

import 'modals/unified_user_flow_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCard } from '../components/component_kit/cw_card';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { UnifiedUserFlowModal } from '../modals/unified_user_flow_modal';

const DISPLAY_INTERVAL = 10 * 1000; // TODO: make 1 Hour wait

// Exists only to abstract user profile modal logic outside of Layout
export class UnifiedUserFlow extends ClassComponent {
  private unifyProfileModalOn = false;

  view(vnode) {
    const userHasDisplayName = app.user.hasDisplayName;

    console.log(app.user);

    if (!this.unifyProfileModalOn && !userHasDisplayName) {
      const lastShownProfileModal = localStorage.getItem(
        'user-profile-modal-last-displayed'
      );

      if (!lastShownProfileModal) {
        localStorage.setItem(
          'user-profile-modal-last-displayed',
          Date.now().toString()
        );
        app.modals.create({ modal: UnifiedUserFlowModal });
      } else {
        const now = new Date();
        const lastShownTime = new Date(parseInt(lastShownProfileModal));
        const timeSinceLastShown = now.getTime() - lastShownTime.getTime();

        if (timeSinceLastShown > DISPLAY_INTERVAL) {
          localStorage.setItem(
            'user-profile-modal-last-displayed',
            Date.now().toString()
          );
          app.modals.create({ modal: UnifiedUserFlowModal });
        }
      }
      this.unifyProfileModalOn = true;
    }

    return <></>;
  }
}

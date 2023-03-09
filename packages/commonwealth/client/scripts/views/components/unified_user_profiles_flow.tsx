/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'modals/unified_user_flow_modal.scss';

import app from 'state';
import { UnifiedUserFlowModal } from '../modals/unified_user_flow_modal';

const DISPLAY_INTERVAL = 60 * 60 * 1000; // 1 hour wait

// Exists only to abstract user profile modal logic outside of Layout
export class UnifiedUserFlow extends ClassComponent {
  private unifyProfileModalOn = false;

  view(vnode) {
    const userHasDisplayName = app.user.hasDisplayName;

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

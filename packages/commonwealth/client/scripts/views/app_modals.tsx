/* @jsx m */

// Modals are Mithril components rendered within the Layout system,
// which manages a stack of currently displayed modals on the screen.
// They have a few unique properties:
//
// - The user can exit the modal by clicking anywhere outside the modal.
// - They can emit `modalcomplete`, which triggers completeCallback().
// - They can emit `modalexit`, which exits after confirming.
// - They can emit `modalforceexit`, which force exits without confirming.
//
// The modalcomplete event should only be used to trigger a
// completeCallback(), and otherwise should be omitted.
//
// You can instantiate a modal by calling `app.modals.create` and
// providing a few parameters: `modal`, `data`, `completeCallback`,
// `exitCallback`
//
// - `data` is passed to the modal, like other Mithril attrs.
// - `completeCallback` is called if/when the modal bubbles up a
//   modalcomplete event, before the modal is closed.
// - `exitCallback` is called after the modal is actually removed
//
// For example:
//
// app.modals.create({
//   modal: ConductActionModal,
//   data: { proposal: proposal },
//   completeCallback: () => {
//     // Modal finished whatever action it was supposed to conduct.
//     // It won't close automatically, but we can trigger a modalexit event now.
//    },
//    exitCallback: () => {
//      // Modal is closed now
//    },
//  },
// })

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { CWModal } from './components/component_kit/cw_modal';

// When the user exits a modal, we delay the exit callback by calling
// setTimeout(exitCallback, 0) so the modal can be removed before
// another one is rendered.
//
// This helps avoid issues with Mithril's rendering engine reusing
// the existing DOM element, which causes event handlers to be carried
// over and may result in the new modal being impossible to exit.
//
const MODAL_REMOVE_DELAY = 0;

function oncreate(spec, confirmExit, completeCallback, exitCallback, vnode) {
  // unfocus currently selected button, to prevent keyboard actions creating multiple modals
  $(document.activeElement).blur();

  // create the modal
  $(vnode.dom)
    .on('modalexit', async (e) => {
      e.stopPropagation();
      const confirmedExit = await confirmExit();
      if (confirmedExit) {
        app.modals.remove(spec);
        m.redraw();
        setTimeout(exitCallback, MODAL_REMOVE_DELAY);
      }
    })
    .on('modalforceexit', async (e) => {
      e.stopPropagation();
      app.modals.remove(spec);
      m.redraw();
      setTimeout(exitCallback, MODAL_REMOVE_DELAY);
    })
    .on('modalcomplete', (e) => {
      e.stopPropagation();
      m.redraw();
      setTimeout(completeCallback, MODAL_REMOVE_DELAY);
    });
}

async function onclickoverlay(spec, confirmExit, exitCallback) {
  const confirmedExit = await confirmExit();
  if (confirmedExit) {
    app.modals.remove(spec);
    m.redraw();
    setTimeout(exitCallback, MODAL_REMOVE_DELAY);
  }
}

export class AppModals implements m.ClassComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  escapeHandler: (e: any) => void; // TODO Gabe 2/2/22 - What kind of event?

  oncreate() {
    this.escapeHandler = (e) => {
      if (e.keyCode !== 27) return;
      app.modals.getList().pop();
      m.redraw();
    };
    $(document).on('keyup', this.escapeHandler);
  }

  onremove() {
    $(document).off('keyup', this.escapeHandler);
  }

  view() {
    return app.modals.getList().map((spec) => (
      <CWModal
        spec={spec}
        key={spec.id || '-'}
        oncreatemodal={oncreate}
        onclick={onclickoverlay}
      >
        {m(spec.modal, spec.data)}
      </CWModal>
    ));
  }
}

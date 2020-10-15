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

import 'modal.scss';

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { featherIcon, symbols } from 'helpers';

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

const Modal: m.Component<{ spec }> = {
  view: (vnode) => {
    const spec = vnode.attrs.spec;
    const completeCallback = spec.completeCallback || (() => undefined);
    const exitCallback = spec.exitCallback || (() => undefined);
    const confirmExit = spec.modal.confirmExit || (() => true);

    return m('.Modal', {
      oncreate: oncreate.bind(this, spec, confirmExit, completeCallback, exitCallback),
    }, [
      m('.overlay', {
        onclick: onclickoverlay.bind(this, spec, confirmExit, exitCallback),
      }, [
        m('.popup', {
          onclick: (e) => {
            e.stopPropagation();
          },
        }, vnode.children),
      ]),
    ]);
  },
};

export const CompactModalExitButton: m.Component<{}> = {
  view: (vnode) => {
    return m('.CompactModalExitButton', {
      onclick: (e) => {
        e.preventDefault();
        $(e.target).trigger('modalexit');
      }
    }, symbols.times);
  }
};

export const AppModals: m.Component<{}, { escapeHandler }> = {
  oncreate: (vnode) => {
    vnode.state.escapeHandler = (e) => {
      if (e.keyCode !== 27) return;
      app.modals.getList().pop();
      m.redraw();
    };
    $(document).on('keyup', vnode.state.escapeHandler);
  },
  onremove: (vnode) => {
    $(document).off('keyup', vnode.state.escapeHandler);
  },
  view: (vnode) => {
    return app.modals.getList().map((spec) => m(Modal, { spec, key: spec.id || '-' }, m(spec.modal, spec.data)));
  }
};

export default Modal;

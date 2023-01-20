/* @jsx m */

import $ from 'jquery';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';

import 'modals/confirm_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';

const ConfirmModal = {
  confirmExit: async () => true,
  view(
    vnode: m.Vnode<{
      prompt: string;
      primaryButton?: string;
      secondaryButton?: string;
    }>
  ) {
    const confirmText = vnode.attrs.prompt || 'Are you sure?';
    const primaryButton = vnode.attrs.primaryButton || 'Yes';
    const secondaryButton = vnode.attrs.secondaryButton || 'Cancel';

    return (
      <div
        class="ConfirmModal"
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onmousedown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div class="compact-modal-body">
          <h3>{confirmText}</h3>
        </div>
        <div class="compact-modal-actions">
          <CWButton
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalcomplete');
              setTimeout(() => {
                $(e.target).trigger('modalexit');
              }, 0);
            }}
            oncreate={(vvnode) => {
              $(vvnode.dom).focus();
            }}
            label={primaryButton}
          />
          <CWButton
            buttonType="secondary-blue"
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            }}
            label={secondaryButton}
          />
        </div>
      </div>
    );
  },
};

export const confirmationModalWithText = (
  prompt: string,
  primaryButton?: string,
  secondaryButton?: string
) => {
  return async (): Promise<boolean> => {
    let confirmed = false;
    return new Promise((resolve) => {
      app.modals.create({
        modal: ConfirmModal,
        data: { prompt, primaryButton, secondaryButton },
        completeCallback: () => {
          confirmed = true;
        },
        exitCallback: () => resolve(confirmed),
      });
    });
  };
};

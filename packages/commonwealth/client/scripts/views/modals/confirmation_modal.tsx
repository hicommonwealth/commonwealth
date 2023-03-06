/* @jsx m */

import $ from 'jquery';
// eslint-disable-next-line
import m from 'mithril';

import 'modals/confirmation_modal.scss';

import app from 'state';
import ClassComponent from 'class_component';
import type { ButtonType } from 'views/components/component_kit/cw_button';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';

type ConfirmationModalAttrs = {
  title?: string;
  description?: string | JSX.Element;
  confirmButton?: { type?: ButtonType; label?: string; onConfirm?: () => void };
  cancelButton?: { type?: ButtonType; label?: string; onCancel?: () => void };
};

export class ConfirmationModal extends ClassComponent<ConfirmationModalAttrs> {
  handleConfirm(e, onConfirm) {
    e.preventDefault();
    onConfirm?.();

    $(e.target).trigger('modalcomplete');
    setTimeout(() => {
      $(e.target).trigger('modalexit');
    }, 0);
  }

  handleCancel(e, onCancel) {
    e.preventDefault();
    onCancel?.();

    $(e.target).trigger('modalexit');
  }

  view(vnode: m.Vnode<ConfirmationModalAttrs>) {
    const {
      title,
      description,
      confirmButton = {},
      cancelButton = {},
    } = vnode.attrs || {};

    return (
      <div class="ConfirmationModal">
        <div class="header">
          {title && <CWText type="h4">{title}</CWText>}
          <ModalExitButton />
        </div>
        {description && (
          <CWText type="b1" className="description">
            {description}
          </CWText>
        )}
        <div className="footer">
          <CWButton
            buttonType={confirmButton.type || 'mini-white'}
            label={confirmButton.label || 'Confirm'}
            onclick={(e) => this.handleConfirm(e, confirmButton.onConfirm)}
          />
          <CWButton
            buttonType={cancelButton.type || 'mini-black'}
            label={cancelButton.label || 'Cancel'}
            onclick={(e) => this.handleConfirm(e, cancelButton.onCancel)}
          />
        </div>
      </div>
    );
  }
}

export const showConfirmationModal = ({
  title,
  description,
  confirmButton,
  cancelButton,
}: ConfirmationModalAttrs) => {
  app.modals.create({
    modal: ConfirmationModal,
    data: { title, description, confirmButton, cancelButton },
  });
};

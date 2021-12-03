import 'components/component_kit/forms.scss';
import { Input } from 'construct-ui';
import m from 'mithril';

export enum TextInputStatus {
  Error = 'error',
  Validate = 'validate',
}

export const TextInput: m.Component<
  {
    name: string;
    oninput?: (e) => null;
    inputValidationFn?: (value: string) => [TextInputStatus, string];
    label?: string;
    className?: string;
    placeholder?: string;
    defaultValue?: string;
  },
  {
    statusMessage: string;
    statusType: TextInputStatus;
    isTyping: boolean;
    inputTimeout;
  }
> = {
  view: (vnode) => {
    const {
      name,
      oninput,
      inputValidationFn,
      label,
      className,
      placeholder,
      defaultValue,
    } = vnode.attrs;
    const { statusMessage, statusType } = vnode.state;
    return m('.TextInput', [
      label && m('label', label),
      m(Input, {
        class: `${className || ''} ${statusType || ''}`,
        name,
        oninput: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (oninput) {
            clearTimeout(vnode.state.inputTimeout);
            vnode.state.inputTimeout = setTimeout(() => {
              oninput(e);
              m.redraw();
            }, 250);
          }
        },
        onfocusout: (e) => {
          if (inputValidationFn) {
            if (!e.target.value?.length) {
              delete vnode.state.statusType;
              delete vnode.state.statusMessage;
              m.redraw();
            } else {
              [vnode.state.statusType, vnode.state.statusMessage] =
                inputValidationFn(e.target.value);
            }
          }
        },
        placeholder,
        defaultValue,
      }),
      statusMessage && m('.status', { class: statusType }, statusMessage),
    ]);
  },
};

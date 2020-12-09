import 'components/forms.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, CustomSelect } from 'construct-ui';

interface IDropdownFormFieldAttrs {
  callback?: CallableFunction;
  choices: IDropdownFormFieldChoice[];
  defaultValue?: string;
  value?: string;
  options?: any;
  name?: string;
  subtitle?: string;
  title?: string;
}

interface IDropdownFormFieldChoice {
  name?: string;
  label: string;
  value: string | number;
  selected?: boolean;
}

export const DropdownFormField: m.Component<IDropdownFormFieldAttrs> = {
  view: (vnode: m.VnodeDOM<IDropdownFormFieldAttrs>) => {
    const { choices, name, defaultValue, subtitle, title } = vnode.attrs;
    const selectAttrs = {
      class: 'form-field',
      name,
      value: vnode.attrs.value,
      defaultValue: defaultValue || choices[0].value,
      options: choices.map(({ label, value }) => ({ label, value })),
      ...vnode.attrs.options
    };
    selectAttrs.onSelect = (choice) => {
      if (vnode.attrs.callback) {
        vnode.attrs.callback(choice.value);
      }
    };

    return m('.DropdownFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m(CustomSelect, selectAttrs)
      ]),
    ]);
  }
};

interface IRadioSelectorFormFieldAttrs {
  callback?: any;
  choices: IRadioSelectorChoice[];
  name: string; // required, used for the form submission
  subtitle?: string;
  title?: string;
}

interface IRadioSelectorChoice {
  name?: string;
  label: string;
  value: number | string;
  checked?: boolean;
}

export const RadioSelectorFormField: m.Component<IRadioSelectorFormFieldAttrs> = {
  view: (vnode: m.VnodeDOM<IRadioSelectorFormFieldAttrs>) => {
    const { choices, name, subtitle, title } = vnode.attrs;

    return m('.RadioSelectorFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m('form.radio-buttons.form-field', choices.map((item) => {
          return [
            m('input[type="radio"]', {
              name,
              value: item.value,
              id: item.value,
              oncreate: (vvnode) => {
                if (item.checked) {
                  $(vvnode.dom).prop('checked', true);
                }
              },
              oninput: (e) => {
                if (vnode.attrs.callback) {
                  vnode.attrs.callback(item.value);
                }
              },
            }),
            m('label', { for: item.value }, item.label),
          ];
        })),
      ]),
    ]);
  }
};

interface IButtonSelectorState {
  initialized?: boolean;
  selection?: any;
}

interface IButtonSelectorAttrs {
  callback?: any;
  choices: IButtonSelectorChoice[];
  defaultSelection?: string | string[];
  name?: string;
  subtitle?: string;
  title?: string;
}

interface IButtonSelectorChoice {
  disabled?: boolean;
  label: any;
  name?: string;
  value: number | string;
}

export const MultipleButtonSelectorFormField: m.Component<IButtonSelectorAttrs, IButtonSelectorState> = {
  view: (vnode: m.VnodeDOM<IButtonSelectorAttrs, IButtonSelectorState>) => {
    const { choices, defaultSelection, subtitle, title } = vnode.attrs;

    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      vnode.state.selection = defaultSelection || [];
    }

    return m('.MultipleButtonSelectorFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m('.form-field.buttons', choices.map((item) => {
          return m(Button, {
            disabled: item.disabled,
            intent: vnode.state.selection.indexOf(item.value) !== -1 ? 'primary' : 'none',
            onclick: (e) => {
              e.preventDefault();
              const index = vnode.state.selection.indexOf(item.value);
              if (index === -1) {
                vnode.state.selection.push(item.value);
              } else {
                vnode.state.selection.splice(index, 1);
              }
              if (vnode.attrs.callback) {
                vnode.attrs.callback(vnode.state.selection);
              }
            },
            label: item.label
          });
        })),
      ]),
    ]);
  }
};

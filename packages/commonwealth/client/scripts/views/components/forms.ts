import 'components/forms.scss';

import m from 'mithril';
import { CustomSelect } from 'construct-ui';

interface IDropdownFormFieldChoice {
  name?: string;
  label: string;
  value: string | number;
  selected?: boolean;
}

interface IDropdownFormFieldAttrs {
  callback?: CallableFunction;
  callbackOnInit?: boolean;
  choices: IDropdownFormFieldChoice[];
  defaultValue?: string;
  value?: string;
  options?: any;
  name?: string;
  subtitle?: string;
  title?: string;
}

export const DropdownFormField: m.Component<IDropdownFormFieldAttrs> = {
  oninit: (vnode: m.VnodeDOM<IDropdownFormFieldAttrs>) => {
    if (vnode.attrs.callbackOnInit && vnode.attrs.callback) {
      vnode.attrs.callback(
        vnode.attrs.defaultValue || vnode.attrs.choices[0].value
      );
    }
  },
  view: (vnode: m.VnodeDOM<IDropdownFormFieldAttrs>) => {
    const { choices, name, defaultValue, subtitle, title } = vnode.attrs;
    if (!choices || choices.length === 0) {
      return;
    }
    const selectAttrs = {
      class: 'form-field',
      name,
      value: vnode.attrs.value,
      defaultValue: defaultValue || choices[0].value,
      options: choices.map(({ label, value }) => ({ label, value })),
      ...vnode.attrs.options,
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
        m(CustomSelect, selectAttrs),
      ]),
    ]);
  },
};

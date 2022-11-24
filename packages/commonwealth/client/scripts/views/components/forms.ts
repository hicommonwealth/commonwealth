import 'components/forms.scss';

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import { CustomSelect } from 'construct-ui';

type IDropdownFormFieldChoice = {
  name?: string;
  label: string;
  value: string | number;
  selected?: boolean;
}

type IDropdownFormFieldAttrs = {
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

export class DropdownFormField extends ClassComponent<IDropdownFormFieldAttrs> {
  public oninit(vnode: m.VnodeDOM<IDropdownFormFieldAttrs>) {
    if (vnode.attrs.callbackOnInit && vnode.attrs.callback) {
      vnode.attrs.callback(
        vnode.attrs.defaultValue || vnode.attrs.choices[0].value
      );
    }
  }
  public view(vnode: m.VnodeDOM<IDropdownFormFieldAttrs>) {
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
  }
}

type IRadioSelectorChoice = {
  name?: string;
  label: string;
  value: number | string;
  checked?: boolean;
}

type IRadioSelectorFormFieldAttrs = {
  callback?: any;
  choices: IRadioSelectorChoice[];
  name: string; // required, used for the form submission
  subtitle?: string;
  title?: string;
}

export class RadioSelectorFormField extends ClassComponent<IRadioSelectorFormFieldAttrs> {
  public view(vnode: m.VnodeDOM<IRadioSelectorFormFieldAttrs>) {
    const { choices, name, subtitle, title } = vnode.attrs;

    return m('.RadioSelectorFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m(
          'form.radio-buttons.form-field',
          choices.map((item) => {
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
                oninput: () => {
                  if (vnode.attrs.callback) {
                    vnode.attrs.callback(item.value);
                  }
                },
              }),
              m('label', { for: item.value }, item.label),
            ];
          })
        ),
      ]),
    ]);
  }
}

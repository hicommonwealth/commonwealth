import 'components/forms.scss';

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';
import $ from 'jquery';
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
  oninit: (vnode: ResultNode<IDropdownFormFieldAttrs>) => {
    if (vnode.attrs.callbackOnInit && vnode.attrs.callback) {
      vnode.attrs.callback(
        vnode.attrs.defaultValue || vnode.attrs.choices[0].value
      );
    }
  },
  view: (vnode: ResultNode<IDropdownFormFieldAttrs>) => {
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

    return render('.DropdownFormField.FormField', [
      render('.form-group', [
        title && render('.form-title', title),
        subtitle && render('.form-subtitle', subtitle),
        render(CustomSelect, selectAttrs),
      ]),
    ]);
  },
};

interface IRadioSelectorChoice {
  name?: string;
  label: string;
  value: number | string;
  checked?: boolean;
}

interface IRadioSelectorFormFieldAttrs {
  callback?: any;
  choices: IRadioSelectorChoice[];
  name: string; // required, used for the form submission
  subtitle?: string;
  title?: string;
}

export const RadioSelectorFormField: m.Component<IRadioSelectorFormFieldAttrs> =
  {
    view: (vnode: ResultNode<IRadioSelectorFormFieldAttrs>) => {
      const { choices, name, subtitle, title } = vnode.attrs;

      return render('.RadioSelectorFormField.FormField', [
        render('.form-group', [
          title && render('.form-title', title),
          subtitle && render('.form-subtitle', subtitle),
          render(
            'form.radio-buttons.form-field',
            choices.map((item) => {
              return [
                render('input[type="radio"]', {
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
                render('label', { for: item.value }, item.label),
              ];
            })
          ),
        ]),
      ]);
    },
  };

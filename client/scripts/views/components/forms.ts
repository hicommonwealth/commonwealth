import 'components/forms.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import ResizableTextarea from 'views/components/widgets/resizable_textarea';

interface ITextFormFieldAttrs {
  callback?: CallableFunction;
  options?: ITextOptions;
  style?: string;
  subtitle?: string;
  title?: string;
}

interface ITextOptions {
  autocomplete?: string;
  autofocus?: boolean;
  callback?: CallableFunction;
  class?: string;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
  oncreate?: any;
  oninput?: any;
  tabindex?: number;
  value?: string | number;
}

export const TextInputFormField: m.Component<ITextFormFieldAttrs> = {
  view: (vnode: m.VnodeDOM<ITextFormFieldAttrs>) => {
    const { options, title, subtitle } = vnode.attrs;

    if (options.autocomplete === undefined) options.autocomplete = 'off';

    const oninput = options.oninput || (() => (undefined));
    options.oninput = (e) => {
      e.redraw = false;
      if (vnode.attrs.callback) {
        vnode.attrs.callback($(e.target).val());
      } else if (options.callback) {
        options.callback($(e.target).val()); // Not recommended. See: https://app.clubhouse.io/commonwealth/story/1193
      }
      oninput.call(this, e);
    };

    return m('.TextInputFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m('input[type="text"].form-field', options),
      ]),
    ]);
  }
};

export const TextareaFormField: m.Component<ITextFormFieldAttrs> = {
  view: (vnode: m.VnodeDOM<ITextFormFieldAttrs>) => {
    const { options, title, subtitle } = vnode.attrs;

    const oninput = options.oninput || (() => (undefined));
    options.oninput = (e) => {
      e.redraw = false;
      if (vnode.attrs.callback) {
        vnode.attrs.callback($(e.target).val());
      }
      oninput.call(this, e);
    };
    options.class = `${options.class || ''} form-field`;

    return m('.TextareaFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m(ResizableTextarea, options),
      ]),
    ]);
  }
};

interface IDropdownFormFieldAttrs {
  callback?: CallableFunction;
  choices: IDropdownFormFieldChoice[];
  options?: any;
  name?: string;
  subtitle?: string;
  title?: string;
}

interface IDropdownFormFieldChoice {
  name: string;
  label: string;
  value: string | number;
  selected?: boolean;
}

export const DropdownFormField: m.Component<IDropdownFormFieldAttrs> = {
  view: (vnode: m.VnodeDOM<IDropdownFormFieldAttrs>) => {
    const options = vnode.attrs.options || {};
    const { choices, name, subtitle, title } = vnode.attrs;
    const oninput = options.oninput || (() => (undefined));

    options.oninput = (e) => {
      e.redraw = false;
      if (vnode.attrs.callback) {
        vnode.attrs.callback($(e.target).val());
      }
      oninput.call(this, e);
    };

    return m('.DropdownFormField.FormField', {
      oncreate: (vnode) => {
        $(vnode.dom).find('select').trigger('input');
      }
    }, [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m('select.form-field', options,
          choices.map((item) => m('option', item))
         ),
      ]),
    ]);
  }
};

interface ICheckboxFormFieldAttrs {
  callback?: CallableFunction;
  label?: string;
  name: string;
  options?: ICheckboxFormFieldOptions;
  title?: string;
}

interface ICheckboxFormFieldOptions {
  class: string;
}

export const CheckboxFormField: m.Component<ICheckboxFormFieldAttrs> = {
  view: (vnode: m.VnodeDOM<ICheckboxFormFieldAttrs>) => {
    const { callback, label, name, title } = vnode.attrs;
    const defaultOptions = {
      id: name,
      oninput: (e) => {
        if (callback) {
          callback(e.target.checked);
        }
      },
    };
    const options = Object.assign(defaultOptions, vnode.attrs.options || {});
    return m('.CheckboxFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        m('form.form-field', [
          m('input[type="checkbox"]', options),
          m('label', { for: name }, label),
        ]),
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
              oncreate: (vnode) => {
                if (item.checked) {
                  $(vnode.dom).prop('checked', true);
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
  defaultSelection?: string;
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

export const ButtonSelectorFormField: m.Component<IButtonSelectorAttrs, IButtonSelectorState> = {
  view: (vnode: m.VnodeDOM<IButtonSelectorAttrs, IButtonSelectorState>) => {
    const { choices, defaultSelection, subtitle, title } = vnode.attrs;

    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      vnode.state.selection = defaultSelection;
    }

    return m('.ButtonSelectorFormField.FormField', [
      m('.form-group', [
        title && m('.form-title', title),
        subtitle && m('.form-subtitle', subtitle),
        m('.form-field.buttons', choices.map((item) => {
          return m('button', {
            disabled: item.disabled,
            class: vnode.state.selection === item.value ? 'active' : '',
            onclick: (e) => {
              e.preventDefault();
              vnode.state.selection = item.value;
              if (vnode.attrs.callback) {
                vnode.attrs.callback(item.value);
              }
            },
          }, item.label);
        })),
      ]),
    ]);
  }
};

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
          return m('button', {
            disabled: item.disabled,
            class: vnode.state.selection.indexOf(item.value) !== -1 ? 'active' : '',
            onclick: (e) => {
              e.preventDefault();
              const index = vnode.state.selection.indexOf(item.value);
              index === -1 ?
                vnode.state.selection.push(item.value) :
                vnode.state.selection.splice(index, 1);
              if (vnode.attrs.callback) {
                vnode.attrs.callback(vnode.state.selection);
              }
            },
          }, item.label);
        })),
      ]),
    ]);
  }
};

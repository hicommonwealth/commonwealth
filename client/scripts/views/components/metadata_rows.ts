import m from 'mithril';
import { Input, TextArea, Switch, Select } from 'construct-ui';

export const InputPropertyRow: m.Component<{
  title: string,
  defaultValue: string,
  value?: string,
  disabled?: boolean,
  onChangeHandler: Function,
  placeholder?: string,
  textarea?: boolean,
}> = {
  view: (vnode) => {
    const { title, defaultValue, value, disabled, onChangeHandler, placeholder, textarea } = vnode.attrs;

    return m('tr.InputPropertyRow', [
      m('td', { class: 'title-column', }, title),
      m('td', [
        m((textarea ? TextArea : Input), {
          defaultValue,
          value,
          placeholder,
          fluid: true,
          disabled: disabled || false,
          oninput: (e) => { onChangeHandler((e.target as any).value); },
        }),
      ]),
    ]);
  }
};

export const TogglePropertyRow: m.Component<{
  title: string,
  defaultValue: boolean,
  disabled?: boolean,
  onToggle: Function,
  caption?: Function,
}, { checked: boolean }> = {
  oninit: (vnode) => {
    vnode.state.checked = vnode.attrs.defaultValue;
  },
  view: (vnode) => {
    return m('tr.TogglePropertyRow', [
      m('td', vnode.attrs.title),
      m('td', { class: 'ToggleContent' }, [
        m(Switch, {
          checked: vnode.state.checked,
          disabled: vnode.attrs.disabled || false,
          onchange: () => {
            vnode.state.checked = !vnode.state.checked;
            vnode.attrs.onToggle(vnode.state.checked);
          },
        }),
        vnode.attrs.caption && m('.switch-caption', vnode.attrs.caption(vnode.state.checked)),
      ])
    ]);
  },
};

export const SelectPropertyRow: m.Component<{
  title: string,
  options: string[],
  value: string,
  onchange: Function
}, { selected: string }> = {
  view: (vnode) => {
    return m('tr.SelectPropertyRow', [
      m('td', vnode.attrs.title),
      m('td', [
        m(Select, {
          options: vnode.attrs.options,
          onchange: (e) => {
            vnode.attrs.onchange((e.currentTarget as HTMLInputElement).value);
          },
          defaultValue: vnode.attrs.value,
        }),
      ])
    ]);
  },
};

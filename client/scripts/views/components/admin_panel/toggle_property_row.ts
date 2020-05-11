import m from 'mithril';
import { Switch } from 'construct-ui';

interface ITogglePropertyRowAttrs {
  title: string;
  defaultValue: boolean;
  disabled?: boolean;
  onToggle: Function;
}

interface ITogglePropertyRowState {
  checked: boolean;
}

const TogglePropertyRow: m.Component<ITogglePropertyRowAttrs, ITogglePropertyRowState> = {
  oninit: (vnode) => {
    vnode.state.checked = vnode.attrs.defaultValue;
  },
  view: (vnode) => {
    return m('tr', {
      class: 'TogglePropertyRow',
    }, [
      m('td', vnode.attrs.title),
      m('td', [
        m(Switch, {
          checked: vnode.state.checked,
          disabled: vnode.attrs.disabled || false,
          onchange: () => {
            vnode.state.checked = !vnode.state.checked;
            vnode.attrs.onToggle(vnode.state.checked);
          },
        })
      ])
    ]);
  },
};

export default TogglePropertyRow;

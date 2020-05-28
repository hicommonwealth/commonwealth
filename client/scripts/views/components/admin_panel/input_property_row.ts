import m from 'mithril';
import { Input } from 'construct-ui';


interface IInputPropertyRowAttrs {
  title: string;
  defaultValue: string;
  disabled?: boolean;
  onChangeHandler: Function;
}

const InputPropertyRow: m.Component<IInputPropertyRowAttrs> = {
  view: (vnode) => {
    return m('tr', {
      class: 'InputPropertyRow',
    }, [
      m('td', { class: 'title-column', }, vnode.attrs.title),
      m('td', [
        m(Input, {
          defaultValue: vnode.attrs.defaultValue,
          fluid: true,
          disabled: vnode.attrs.disabled || false,
          onkeyup: (e) => { vnode.attrs.onChangeHandler((e.target as any).value); },
        }),
      ]),
    ]);
  }
};

export default InputPropertyRow;

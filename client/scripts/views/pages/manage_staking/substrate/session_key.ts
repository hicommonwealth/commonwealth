import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import { Input, Tooltip, Icons, Icon, Intent } from 'construct-ui';
import { isHex } from '@polkadot/util';

interface SessionKeyState { dynamic: { } }

interface SessionKeyAttrs {
  onChange(key: string, valid?: boolean): void,
}

export interface IModelPartial {
  intent: Intent,
  valid: boolean,
  onchange(element: Event): void
}

interface IModel extends IModelPartial {
  key: string,
}

const model: IModel = {
  intent: null,
  key: '0x00',
  valid: false,
  onchange: (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const _key = target.value;
    model.valid = true;
    model.intent = Intent.POSITIVE;

    if (!isHex(_key)) {
      model.intent = Intent.NEGATIVE;
      model.valid = false;
    }

    model.key = _key;
  }
};

const SessionKey = makeDynamicComponent<SessionKeyAttrs, SessionKeyState>({
  oninit: () => {
    model.key = '0x00';
    model.valid = false;
    model.intent = null;
  },
  onupdate: (vnode) => {
    vnode.attrs.onChange(model.key, model.valid);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    return m('.Validate', [
      m('h5', 'Keys from rotateKeys', m(Tooltip, {
        content: `Changing the key only takes effect at the start of the next session. 
        The input here is generates from the author_rotateKeys command`,
        position: 'top',
        hasArrow: true,
        size: 'sm',
        trigger: m('span.pointer', m(Icon, { name: Icons.HELP_CIRCLE, size: 'sm' }))
      })),
      m(Input, {
        fluid: true,
        intent: model.intent,
        onchange: model.onchange,
        placeholder: '0x...'
      })
    ]);
  },
});

export default SessionKey;

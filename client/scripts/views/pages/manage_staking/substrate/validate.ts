import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import { Input, Tooltip, Icons, Icon, Intent } from 'construct-ui';
import { IModelPartial } from './session_key';

interface ValidateState { dynamic: {
} }

interface ValidateAttrs {
  onChange(commission: number, valid?: boolean): void,
}

interface IModel extends IModelPartial {
  balance: number,
}

const model: IModel = {
  intent: null,
  valid: false,
  balance: 0,
  onchange: (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const balance = Number(target.value);

    model.intent = Intent.POSITIVE;
    model.valid = true;

    if (Number.isNaN(balance) || balance < 0 || balance > 100) {
      model.intent = Intent.NEGATIVE;
      model.valid = false;
    }

    model.balance = balance;
  }
};

const Validate = makeDynamicComponent<ValidateAttrs, ValidateState>({
  oninit: () => {
    model.balance = 0;
    model.valid = false;
    model.intent = null;
  },
  onupdate: (vnode) => {
    vnode.attrs.onChange(model.balance, model.valid);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    return m('.Validate.padding-t-10', [
      m('h5', 'reward commission percentage', m(Tooltip, {
        content: 'The percentage reward (0-100) that should be applied for the validator',
        position: 'top',
        hasArrow: true,
        size: 'sm',
        trigger: m('span.pointer', m(Icon, { name: Icons.HELP_CIRCLE, size: 'sm' }))
      })),
      m(Input, {
        fluid: true,
        intent: model.intent,
        onchange: model.onchange,
        placeholder: '0-100'
      })
    ]);
  },
});

export default Validate;

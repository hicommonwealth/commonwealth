import m from 'mithril';
import { Classes } from 'client/scripts/views/components/component_kit/construct-kit/_shared';
import { BaseControl, IControlAttrs } from 'client/scripts/views/components/component_kit/construct-kit/components/base-control';

export class Radio implements m.Component<IControlAttrs> {
  public view({ attrs }: m.Vnode<IControlAttrs>) {
    return m(BaseControl, {
      ...attrs,
      type: 'radio',
      typeClass: Classes.RADIO
    });
  }
}

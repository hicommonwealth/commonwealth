import m from 'mithril';
import classnames from 'classnames';
import { Classes, IAttrs } from 'client/scripts/views/components/component_kit/construct-kit/_shared';
import { Grid, IGridAttrs } from 'client/scripts/views/components/component_kit/construct-kit/components/grid';

export interface IFormAttrs extends IAttrs, IGridAttrs {
  [htmlAttrs: string]: any;
}

export class Form implements m.Component<IFormAttrs> {
  public view({ attrs, children }: m.Vnode<IFormAttrs>) {
    const classes = classnames(
      Classes.FORM,
      attrs.class
    );

    return m(Grid, {
      ...attrs,
      element: 'form',
      class: classes
    }, children);
  }
}

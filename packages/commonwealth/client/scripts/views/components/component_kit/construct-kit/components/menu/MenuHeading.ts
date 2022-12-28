import m from 'mithril';
import classnames from 'classnames';
import { Classes, IAttrs, ISizeAttrs } from 'client/scripts/views/components/component_kit/construct-kit/_shared';

export interface IMenuHeadingAttrs extends IAttrs, ISizeAttrs { }

export class MenuHeading implements m.Component<IMenuHeadingAttrs> {
  public view({ attrs, children }: m.Vnode<IMenuHeadingAttrs>) {
    const { class: className, ...htmlAttrs } = attrs;

    return m('', {
      class: classnames(Classes.MENU_HEADING, className),
      ...htmlAttrs
    }, children);
  }
}

import m from 'mithril';
import classnames from 'classnames';
import { Classes } from 'client/scripts/views/components/component_kit/construct-kit';
import { IPopoverAttrs, Popover } from 'client/scripts/views/components/component_kit/construct-kit/components/popover';
import { IMenuAttrs, Menu } from 'client/scripts/views/components/component_kit/construct-kit/components/menu';

export interface IPopoverMenuAttrs extends IPopoverAttrs {
  /** Attrs passed through to Menu component */
  menuAttrs?: IMenuAttrs;
}

export class PopoverMenu implements m.Component<IPopoverMenuAttrs> {
  public view({ attrs }: m.Vnode<IPopoverMenuAttrs>) {
    const { class: className, menuAttrs, content, ...popoverAttrs } = attrs;

    return m(Popover, {
      ...popoverAttrs,
      class: classnames(Classes.POPOVER_MENU, className),
      content: m(Menu, { ...menuAttrs }, content)
    });
  }
}

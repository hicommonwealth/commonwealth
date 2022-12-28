import m from 'mithril';
import classnames from 'classnames';
import { Classes } from 'client/scripts/views/components/component_kit/construct-kit/_shared';
import { Button, IButtonAttrs } from 'client/scripts/views/components/component_kit/construct-kit/components/button';
import { PopoverMenu, IPopoverMenuAttrs } from 'client/scripts/views/components/component_kit/construct-kit/components/popover-menu';
import { Icons } from 'client/scripts/views/components/component_kit/construct-kit/components/icon';

export interface IMenuItemAttrs extends IButtonAttrs {
  /** Submenu (Menu component) */
  submenu?: m.Children;

  /** Close submenu on child item click */
  closeOnSubmenuClick?: boolean;

  /** Attrs passed through to Popover (if submenu exists) */
  popoverMenuAttrs?: Partial<IPopoverMenuAttrs>;

  [htmlAttrs: string]: any;
}

export class MenuItem implements m.Component<IMenuItemAttrs> {
  public view({ attrs }: m.Vnode<IMenuItemAttrs>) {
    const {
      class: className,
      submenu,
      closeOnSubmenuClick,
      popoverMenuAttrs,
      ...buttonAttrs
    } = attrs;

    const classes = classnames(
      Classes.MENU_ITEM,
      Classes.BASIC,
      className
    );

    const button = m(Button, {
      align: 'left',
      compact: true,
      iconRight: submenu ? Icons.CHEVRON_RIGHT : undefined,
      ...buttonAttrs,
      class: classes
    });

    return submenu ? m(PopoverMenu, {
      hasArrow: false,
      interactionType: 'hover',
      openOnTriggerFocus: true,
      position: 'right-start',
      ...popoverMenuAttrs,
      closeOnContentClick: closeOnSubmenuClick,
      addToStack: false,
      content: submenu,
      inline: true,
      restoreFocus: false,
      trigger: button
    }) : button;
  }
}

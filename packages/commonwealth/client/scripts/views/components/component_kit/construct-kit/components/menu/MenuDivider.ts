import m from 'mithril';
import { Classes } from 'client/scripts/views/components/component_kit/construct-kit/_shared';

export class MenuDivider implements m.Component {
  public view() {
    return m(`.${Classes.MENU_DIVIDER}`);
  }
}

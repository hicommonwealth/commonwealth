/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import Sublayout from 'views/sublayout';
import { ComponentShowcase } from '../components/component_kit/cw_component_showcase';

class ComponentsPage extends ClassComponent {
  view() {
    return (
      <Sublayout
      // title="Commonwealth UI Component Kit"
      >
        <ComponentShowcase />
      </Sublayout>
    );
  }
}

export default ComponentsPage;

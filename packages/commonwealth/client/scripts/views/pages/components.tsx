/* @jsx m */

import m from 'mithril';
import Sublayout from 'views/sublayout';
import { ComponentShowcase } from '../components/component_kit/cw_component_showcase';

const ComponentsPage: m.Component = {
  view: () => {
    return (
      <Sublayout
      // title="Commonwealth UI Component Kit"
      >
        <ComponentShowcase />
      </Sublayout>
    );
  },
};

export default ComponentsPage;

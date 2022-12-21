/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
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

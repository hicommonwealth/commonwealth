import m from 'mithril';
import Sublayout from 'views/sublayout';
import { ComponentShowcase } from '../components/component_kit/cw_component_showcase';

const ComponentsPage: m.Component = {
  view: () => {
    return m(
      Sublayout,
      {
        title: 'Commonwealth UI Component Kit',
        alwaysShowTitle: true,
      },
      [m(ComponentShowcase)]
    );
  },
};

export default ComponentsPage;

import m from 'mithril';
import Sublayout from 'views/sublayout';
import ComponentKit from '../components/component_kit/component_listing';

const ComponentsPage: m.Component<{}, {}> = {
  view: () => {
    return m(
      Sublayout,
      {
        title: 'Commonwealth UI Component Kit',
        class: 'ComponentsPage',
        alwaysShowTitle: true,
      },
      [m(ComponentKit)]
    );
  },
};

export default ComponentsPage;

import m from 'mithril';
import ClassComponent from 'class_component';

class GeometricPatternSection extends ClassComponent<{}, {}> {
  public view(vnode) {
    return m(
      'section',
      {
        class:
          'bg-geometric-pattern bg-cover bg-full pt-20 pb-5 relative h-1/4',
      },
      vnode.children
    );
  },
};

export default GeometricPatternSection;

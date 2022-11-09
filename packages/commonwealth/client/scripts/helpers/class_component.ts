import m from 'mithril';

declare global {
  namespace JSX {
    interface ElementClass {
      view: any;
    }

    interface IntrinsicElements {
      __props: any
    }

    interface ElementAttributesProperty {
      __props: any
    }
  }
}

export default abstract class ClassComponent<P extends Record<string, unknown> = {}> implements m.ClassComponent<P> {
  /** Do not use, only used for JSX validation */
  protected readonly __props: P;

  abstract view(v: m.Vnode<P>): m.Children | null;
}

import m from 'mithril';

// declare namespace JSX {
//   interface ElementClass {
//     view: any;
//   }
// }

export declare abstract class MithrilTsxComponent<A> implements m.Component<A> {
  // private __tsx_attrs: A & { key?: string | number };
  abstract view(vnode: m.Vnode<A, this>): m.Children | null | void;
}

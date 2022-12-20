import m from 'mithril';

/// CYANO CODE

// m() => render
export const render: m.Static & {
  trust: (html: string, wrapper?: string) => m.Vnode<unknown, unknown>;
} = m;

const { trust } = m;

render.trust = (html: string, wrapper?: string) =>
  wrapper ? render(wrapper, trust(html)) : trust(html);

export type Children = m.Children;
export type Component<Attrs = {}, State = {}> = m.Component<Attrs, State>;

export const jsx = m;

// vnode => ResultNode
export type ResultNode<T = unknown> = m.Vnode<T, unknown>;

/// END CYANO CODE

// m.ClassComponent => ClassComponent
export abstract class ClassComponent<A = {}> implements m.ClassComponent<A> {
  /** Do not use, only used for JSX validation */
  protected readonly __props: A;

  abstract view(v: ResultNode<A>): Children | null;
}

/*
m.redraw (=> redraw())
m.route.set (=> navigate())
everything in app.ts (router)
*/
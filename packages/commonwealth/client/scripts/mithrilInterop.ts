/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
import mithril from 'mithril';

/// CYANO CODE

// render() => render
export const render: mithril.Static & {
  trust: (html: string, wrapper?: string) => mithril.Vnode<unknown, unknown>;
} = mithril;

const { trust } = mithril;

render.trust = (html: string, wrapper?: string) =>
  wrapper ? render(wrapper, trust(html)) : trust(html);

export type Children = mithril.Children;
export type Component<Attrs = {}, State = {}> = mithril.Component<Attrs, State>;

export const jsx = mithril;

// vnode => ResultNode
export type ResultNode<T = unknown> = mithril.Vnode<T, unknown> & { dom?: Element };

/// END CYANO CODE

// mithril.ClassComponent => ClassComponent
export abstract class ClassComponent<A = {}> implements mithril.ClassComponent<A> {
  /** Do not use, only used for JSX validation */
  protected readonly __props: A;

  public oninit(v: ResultNode<A>) { }
  public onupdate(v: ResultNode<A>) { }
  public onremove(v: ResultNode<A>) { }
  public oncreate(v: ResultNode<A>) { }

  abstract view(v: ResultNode<A>): Children | null;
}

export function setRoute(route: string, data?: any, options?: mithril.RouteOptions) {
  mithril.route.set(route, data, options);
}

export function getRouteParam(name?: string) {
  if (name) {
    return mithril.route.param(name);
  } else {
    return mithril.route.param();
  }
}

export function getRoute() {
  return mithril.route.get();
}

export function redraw(sync = false) {
  if (!sync) {
    mithril.redraw();
  } else {
    mithril.redraw.sync()
  }
}

export function parsePathname(url: string): { path: string; params: mithril.Params } {
  return mithril.parsePathname(url);
}

export function rootRender(el: Element, vnodes: Children): void {
  return mithril.render(el, vnodes);
}

export function rootMount(element: Element, component?: any | null): void {
  mithril.mount(element, component);
}

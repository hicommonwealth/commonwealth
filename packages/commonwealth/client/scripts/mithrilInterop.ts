/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
import m from 'mithril';

/// CYANO CODE

// render() => render
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
export type ResultNode<T = unknown> = m.Vnode<T, unknown> & { dom?: Element };

/// END CYANO CODE

// m.ClassComponent => ClassComponent
export abstract class ClassComponent<A = {}> implements m.ClassComponent<A> {
  /** Do not use, only used for JSX validation */
  protected readonly __props: A;

  public oninit(v: ResultNode<A>) { }
  public onupdate(v: ResultNode<A>) { }
  public onremove(v: ResultNode<A>) { }
  public oncreate(v: ResultNode<A>) { }

  abstract view(v: ResultNode<A>): Children | null;
}

export function setRoute(route: string, data?: any, options?: m.RouteOptions) {
  m.route.set(route, data, options);
}

export function getRouteParam(name?: string) {
  if (name) {
    return m.route.param(name);
  } else {
    return m.route.param();
  }
}

export function getRoute() {
  return m.route.get();
}

export function redraw(sync = false) {
  if (!sync) {
    m.redraw();
  } else {
    m.redraw.sync()
  }
}

export function parsePathname(url: string): { path: string; params: m.Params } {
  return m.parsePathname(url);
}

export function rootRender(el: Element, vnodes: Children): void {
  return m.render(el, vnodes);
}

export function rootMount(element: Element, component?: any | null): void {
  m.mount(element, component);
}

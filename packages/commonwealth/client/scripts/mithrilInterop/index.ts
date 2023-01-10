/**
 * Defines a mithril interoperability layer whose functionality is backed by REACT.
 *
 * The set of functions defined here should match the exact interfaces mithril-based layer,
 * such that it can be swapped out by exporting this file in `mithrilInterop.ts`.
 *
 * This file is currently using the `.ts.new` extension to avoid compilation and typechecking,
 * as we do not want to expose its imports and features until we are prepared to migrate to react.
 */

import {
  createElement,
  FunctionComponent,
  ReactNode,
  // eslint-disable-next-line import/no-unresolved
  Component as ReactComponent,
} from 'react';
import { redirect } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

// RENDERING FUNCTIONS
export type Children = ReactNode | ReactNode[];

export const render = (tag: string | React.ComponentType, attrs: any = {}, ...children: any[]) => {
  // console.log(tag, attrs, children);
  let className = attrs?.className;

  // check if selector starts with class (.)
  if (typeof tag === 'string' && tag[0] === '.') {
    if (className) {
      className = `${className} ${tag.slice(1)}`;
    } else {
      className = tag.slice(1);
    }
    tag = 'div';
  }

  // check if selector has class (.)
  if (typeof tag === 'string' && tag.includes('.')) {
    const [selector, ...classes] = tag.split('.');

    if (className) {
      className = `${className} ${classes.join(' ')}`;
    } else {
      className = classes.join(' ');
    }

    tag = selector;
  }

  // handle children without attrs
  if (Array.isArray(attrs) || typeof attrs !== 'object') {
    children = attrs;
    attrs = { className };
  } else {
    attrs = { ...attrs };
  }

  // ensure vnode.className exists
  attrs.className = className;

  // react forbids <img> tags to have children
  if (tag === 'img') {
    return createElement(tag, attrs);
  }

  // ensure vnode.children exists
  attrs.children = children;

  if (typeof tag === 'string') {
    return createElement(tag, attrs, ...children);
  } else {
    return createElement(tag, attrs, ...children);
  }
};

render.trust = (html: string, wrapper?: string) => {
  if (wrapper) {
    return createElement(wrapper, { dangerouslySetInnerHTML: { __html: html } });
  } else {
    return createElement('div', { dangerouslySetInnerHTML: { __html: html } });
  }
};

export type Component<Props = unknown> = FunctionComponent<Props>;

export const jsx = createElement;

export type ResultNode<A = {}> = { attrs: A, children: Children };

const IGNORED_PROPS = [
  'props',
  'state',
  '_isMounted',
  '_seenProps',
  'context',
]

export abstract class ClassComponent<A = {}> extends ReactComponent<A & { children?: Children }> {
  protected readonly __props: A;
  private _isMounted = false;
  private _seenProps = [];

  constructor(props) {
    super(props);
    return new Proxy(this, {
      set(obj, prop, value) {
        if (
          // do not update if not yet mounted
          obj._isMounted

          // do not update on reserved keyword changes
          && !IGNORED_PROPS.includes(prop as string)

          // do not update if the prop is inherited = internal to React
          && Object.keys(obj).includes(prop as string)

          // do not update if the value doesn't change
          && obj[prop] !== value

          // do not update if the value is a function (not sure if necessary)
          && typeof value !== 'function') {
          obj.setState({ ...obj.state, [prop]: value })
          obj._seenProps.push(prop);
          // console.log(prop, value);
        }
        // @ts-ignore
        return Reflect.set(...arguments);
      }
    })
  }

  public componentDidMount() {
    this.oninit({ attrs: this.props, children: this.props.children });
    this._isMounted = true;
  }

  public componentDidUpdate(prevProps: A) {
    this.onupdate({ attrs: this.props, children: this.props.children });
  }

  public componentWillUnmount() {
    this.onremove({ attrs: this.props, children: this.props.children });
    this._isMounted = false;
  }

  render() {
    this.oncreate({ attrs: this.props, children: this.props.children });
    return this.view({ attrs: this.props, children: this.props.children });
  }

  public oninit(v: ResultNode<A>) {};
  public onupdate(v: ResultNode<A>) {};
  public onremove(v: ResultNode<A>) {};
  public oncreate(v: ResultNode<A>) {};

  abstract view(v: ResultNode<A>): Children | null;

  public redraw(sync = false) {
    this.forceUpdate();
  }
}

export function redraw(sync = false, component?: any) {
  // TODO
  if (component) {
    console.log(component)
    component.forceUpdate();
  }
}

// DOM FUNCTIONS
export function rootMount(element: Element, component?: any | null) {
  return createRoot(element).render(component);
}

export function rootRender(el: Element, vnodes: Children) {
  return rootMount(el, render('div', {}, vnodes));
}

// ROUTING FUNCTIONS
type RouteOptions = {
  replace?: boolean;
};

type Params = { [key: string]: string };

export function getRouteParam(name?: string) {
  const search = new URLSearchParams(window.location.search);
  return search.get(name);
}

export function getRoute() {
  return window.location.pathname;
}

export function setRoute(route: string, data?: Record<string, unknown>, options?: RouteOptions) {
  // app._lastNavigatedBack = false;
  // app._lastNavigatedFrom = getRoute();
  /*
  if (route !== getRoute()) {
    if (options?.replace) {
      window.history.replaceState(data, null, route);
    } else {
      window.history.pushState(data, null, route);
    }
  }
  */

  redirect(route);
  // reset scroll position
  const html = document.getElementsByTagName('html')[0];
  if (html) html.scrollTo(0, 0);
  const body = document.getElementsByTagName('body')[0];
  if (body) body.scrollTo(0, 0);
}

export function parsePathname(url: string): { path: string; params: Params } {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  const params: Params = {};
  for (const [key, value] of search) {
    params[key] = value;
  }
  return { path, params };
}

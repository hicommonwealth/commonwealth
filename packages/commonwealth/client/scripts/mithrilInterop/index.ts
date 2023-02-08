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
import { redirect, NavigateFunction } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

// corresponds to Mithril's "Children" type -- RARELY USED
export type Children = ReactNode | ReactNode[];

// corresponds to Mithril's `m()` call
export const render = (
  tag: string | React.ComponentType,
  attrs: any = {},
  ...children: any[]
) => {
  let className = attrs?.className;

  // check if selector uses classes (.) and convert to props, as
  // Mithril supports e.g. `.User.etc` tags while React does not
  if (typeof tag === 'string' && tag.includes('.')) {
    const [selector, ...classes] = tag.split('.');

    if (className) {
      className = `${className} ${classes.join(' ')}`;
    } else {
      className = classes.join(' ');
    }

    // replace pure class selector (e.g. .User) with div (e.g. div.User)
    tag = selector || 'div';
  }

  // handle children without attrs => corresponds to `m(tag, children)`
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

  // ensure vnode.children exists as mithril expects
  attrs.children = children;

  return createElement(tag, attrs, ...children);
};

// corresponds to Mithril's `m.trust()` call, which is used to render inner HTML directly
render.trust = (html: string, wrapper?: string) => {
  if (wrapper) {
    return createElement(wrapper, {
      dangerouslySetInnerHTML: { __html: html },
    });
  } else {
    return createElement('div', { dangerouslySetInnerHTML: { __html: html } });
  }
};

// Mithril component type, maps to FC
export type Component<Props = unknown> = FunctionComponent<Props>;

// corresponds to Mithril's Vnode type with attrs only (no state)
export type ResultNode<A = unknown> = { attrs: A; children: Children };

// Additions to base React Component attrs
type AdditionalAttrs = {
  // simulate mithril's vnode.children
  children?: Children;

  // optionally used navigation for NavigationWrapper, see `./helpers.tsx`
  navigate?: NavigateFunction;
};

// Replicates Mithril's ClassComponent functionality with support for JSX syntax.
// Expects state on `this`, with redraws on this variable assignments.
export abstract class ClassComponent<A = unknown> extends ReactComponent<
  A & AdditionalAttrs
> {
  protected readonly __props: A;
  private _isMounted = false;

  // props that should not trigger a redraw -- internal to React
  private static readonly IGNORED_PROPS = [
    'props',
    'state',
    '_isMounted',
    'context',
  ];

  constructor(props) {
    super(props);

    // proxy props to trigger redraws on prop changes
    return new Proxy(this, {
      set(obj, prop, value) {
        if (
          // do not update if not yet mounted
          obj._isMounted &&
          // do not update on reserved keyword changes
          !ClassComponent.IGNORED_PROPS.includes(prop as string) &&
          // do not update if the prop is inherited = internal to React
          Object.keys(obj).includes(prop as string) &&
          // do not update if the value doesn't change
          obj[prop] !== value &&
          // do not update if the value is a function (not sure if necessary)
          typeof value !== 'function'
        ) {
          obj.setState({ ...obj.state, [prop]: value });
          // console.log(prop, value);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line prefer-rest-params
        return Reflect.set(...arguments);
      },
    });
  }

  // used for mithril's `oninit` lifecycle hook
  public componentDidMount() {
    this.oninit({ attrs: this.props, children: this.props.children });
    this._isMounted = true;
  }

  // used for mithril's `onupdate` lifecycle hook
  public componentDidUpdate(prevProps: A) {
    this.onupdate({ attrs: this.props, children: this.props.children });
  }

  // used for mithril's `onremove` lifecycle hook
  public componentWillUnmount() {
    this.onremove({ attrs: this.props, children: this.props.children });
    this._isMounted = false;
  }

  // used for mithril's `oncreate` lifecycle hook and for the main `view` function
  render() {
    this.oncreate({ attrs: this.props, children: this.props.children });
    return this.view({ attrs: this.props, children: this.props.children });
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  public oninit(v: ResultNode<A>) {}
  public onupdate(v: ResultNode<A>) {}
  public onremove(v: ResultNode<A>) {}
  public oncreate(v: ResultNode<A>) {}

  abstract view(v: ResultNode<A>): Children | null;

  // replicates `m.redraw()` functionality -- sync is ignored
  public redraw(sync = false) {
    this.forceUpdate();
  }

  // replicates `m.route.set()` functionality via react-router
  public setRoute(route: string) {
    if (this.props.navigate) {
      console.log('setting route', route);
      this.props.navigate(route);
    }
  }

  // replicates navigation to scoped page functionality via react-router
  // see `navigateToSubpage` in `app.tsx`
  public navigateToSubpage(route: string) {
    console.log('Redirecting to', route);
    // hacky way to get the current scope
    // @REACT @TODO: this will fail on custom domains
    const scope = window.location.pathname.split('/')[1];
    if (scope) {
      this.setRoute(`/${scope}${route}`);
    } else {
      this.setRoute(route);
    }
  }
}

// m.rendraw() shim. NO-OP.
export function redraw(sync = false, component?: any) {
  // TODO
  if (component) {
    console.log(component);
    component.forceUpdate();
  }
}

// m.mount() shim
export function rootMount(element: Element, component?: any | null) {
  return createRoot(element).render(component);
}

// m.render() shim
export function rootRender(el: Element, vnodes: Children) {
  return rootMount(el, render('div', {}, vnodes));
}

// ROUTING FUNCTIONS
// m.route.param() shim
export function getRouteParam(name?: string) {
  const search = new URLSearchParams(window.location.search);
  return search.get(name);
}

// m.route.get() shim
export function getRoute() {
  return window.location.pathname;
}

type RouteOptions = {
  replace?: boolean;
};

// attempt to replicate global m.route.set(), currently a no-op.
export function setRoute(
  route: string,
  data?: Record<string, unknown>,
  options?: RouteOptions
) {
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

type Params = { [key: string]: string };

// m.route.parsePathname() shim
export function parsePathname(url: string): { path: string; params: Params } {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  const params: Params = {};
  for (const [key, value] of search) {
    params[key] = value;
  }
  return { path, params };
}

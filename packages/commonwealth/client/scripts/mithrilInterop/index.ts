/**
 * Defines a mithril interoperability layer whose functionality is backed by REACT.
 *
 * The set of functions defined here should match the exact interfaces mithril-based layer,
 * such that it can be swapped out by exporting this file in `mithrilInterop.ts`.
 *
 * This file is currently using the `.ts.new` extension to avoid compilation and typechecking,
 * as we do not want to expose its imports and features until we are prepared to migrate to react.
 */

import type { FunctionComponent, ReactNode } from 'react';
import { createElement, Component as ReactComponent } from 'react';
import type {
  NavigateFunction,
  Location,
  NavigateOptions,
} from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { getScopePrefix } from 'navigation/helpers';

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

  // react forbids <img> and <br> tags to have children
  if (tag === 'img' || tag == 'br') {
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

export type ClassComponentRouter = {
  location: Location;
  navigate: NavigateFunction;
  params: Readonly<Record<string, string | undefined>>;
};
// Additions to base React Component attrs
type AdditionalAttrs = {
  // simulate mithril's vnode.children
  children?: Children;

  // optionally used navigation for withRouter, see `navigation/helpers.tsx`
  router?: ClassComponentRouter;
};

// Replicates Mithril's ClassComponent functionality with support for JSX syntax.
// Expects state on `this`, with redraws on this variable assignments.
export abstract class ClassComponent<A = unknown> extends ReactComponent<
  A & AdditionalAttrs
> {
  protected readonly __props: A;
  private _isMounted = false;
  private _isCreated = false;

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
    if (!this._isCreated) {
      this._isCreated = true;
      this.oncreate({ attrs: this.props, children: this.props.children });
    }
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

  // It works very similar as useCommonNavigate but only for class components with withRouter() HOC
  public setRoute(
    route: string,
    options?: NavigateOptions,
    prefix?: null | string
  ) {
    const scopePrefix = getScopePrefix(prefix);
    if (this.props.router.navigate) {
      const url = `${scopePrefix}${route}`;
      this.props.router.navigate(url, options);
    } else {
      console.error('Prop "navigate" is not defined!');
    }
  }
}

// m.rendraw() shim. NO-OP.
export function redraw(sync = false, component?: any) {
  // TODO
  if (component) {
    console.log(component);
    component.forceUpdate();
  } else {
    // console.trace('no-op redraw called!');
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
// Do not use for new features. Instead, take a look on react-router hook => "useSearchParams"
export function _DEPRECATED_getSearchParams(name?: string) {
  const search = new URLSearchParams(window.location.search);
  return search.get(name);
}

// m.route.get() shim
// Do not use for new features. Instead, take a look on react-router hook => "useLocation"
export function _DEPRECATED_getRoute() {
  return window.location.pathname;
}

// This should not be used for setting the route, because it does not use react-router.
// Instead, it uses native history API, and because react router does not recognize the
// path change, the page has to be reloaded programmatically.
// This is only for legacy code, where react router is not accessible (eg in controllers or JS classes).
// Always use "withRouter" for react class components or "useNavigate" for functional components.
export function _DEPRECATED_dangerouslySetRoute(route: string) {
  window.history.pushState('', '', route);
  window.location.reload();

  const html = document.getElementsByTagName('html')[0];
  if (html) html.scrollTo(0, 0);
  const body = document.getElementsByTagName('body')[0];
  if (body) body.scrollTo(0, 0);
}

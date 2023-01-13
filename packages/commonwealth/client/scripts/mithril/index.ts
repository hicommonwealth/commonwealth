/* eslint-disable @typescript-eslint/no-namespace */
import { Static as MStatic, Route } from 'mithril-lib';
import * as lib from './mithril';

namespace Mithril {
  export interface Static extends MStatic { }
}

// eslint-disable-next-line prefer-rest-params
const m = function () { return lib.render.apply(this, arguments); };

m.m = lib.render;
m.trust = lib.trust
m.fragment = lib.fragment;

// FROM old fragment-fix.js
m.Fragment = {
    view(vnode) {
      return vnode.children;
    },
};

// eslint-disable-next-line prefer-rest-params
m.redraw = function () { return lib.redraw.apply(this, arguments); } as Mithril.Static['redraw'];
m.redraw.sync = () => lib.redraw(true)

m.mount = lib.rootMount;
m.render = lib.rootRender;
m.route = {
  set: lib.setRoute,
  get: lib.getRoute,
  param: lib.getRouteParam,
  prefix: '',
} as Route;
m.parsePathname = lib.parsePathname;
m.request = lib.request;

m.vnode = () => { throw new Error('not implemented'); };
m.jsonp = () => { throw new Error('not implemented'); };
m.parseQueryString = () => { throw new Error('not implemented'); };
m.buildQueryString = () => { throw new Error('not implemented'); };
m.buildPathname = () => { throw new Error('not implemented'); };
m.PromisePolyfill = () => { throw new Error('not implemented'); };
m.censor = () => { throw new Error('not implemented'); };

export default m as Mithril.Static;

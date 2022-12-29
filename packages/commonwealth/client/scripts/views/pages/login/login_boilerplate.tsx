/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/login/login_boilerplate.scss';

import { modalRedirectClick } from 'helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type LoginBoilerplateAttrs = {
  darkMode?: boolean;
};

export class LoginBoilerplate extends ClassComponent<LoginBoilerplateAttrs> {
  view(vnode: ResultNode<LoginBoilerplateAttrs>) {
    const { darkMode } = vnode.attrs;

    return (
      <div
        className={getClasses<{ darkMode?: boolean }>(
          { darkMode },
          'LoginBoilerplate'
        )}
      >
        <CWText type="caption" className="boilerplate-text" isCentered>
          By connecting to Common, you agree to our{' '}
          <a
            className="link"
            onClick={(e) => {
              modalRedirectClick(e, '/terms');
            }}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            className="link"
            onClick={(e) => {
              modalRedirectClick(e, '/privacy');
            }}
          >
            Privacy Policy
          </a>
        </CWText>
      </div>
    );
  }
}

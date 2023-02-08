/* @jsx jsx */
import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, jsx } from 'mithrilInterop';

import { modalRedirectClick } from 'helpers';

import 'pages/login/login_boilerplate.scss';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import withRouter from 'navigation/helpers';

type LoginBoilerplateAttrs = {
  darkMode?: boolean;
};

class LoginBoilerplateComponent extends ClassComponent<LoginBoilerplateAttrs> {
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
              modalRedirectClick(e, () => this.props.router.navigate('/terms'));
            }}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            className="link"
            onClick={(e) => {
              modalRedirectClick(e, () =>
                this.props.router.navigate('/privacy')
              );
            }}
          >
            Privacy Policy
          </a>
        </CWText>
      </div>
    );
  }
}

export const LoginBoilerplate = withRouter(LoginBoilerplateComponent);

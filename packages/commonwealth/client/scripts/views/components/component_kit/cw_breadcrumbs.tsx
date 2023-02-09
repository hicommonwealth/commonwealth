/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_breadcrumbs.scss';
import { CWText } from './cw_text';

import { ComponentType } from './types';
import { useNavigate } from 'react-router-dom';

type BreadcrumbsType = {
  label: string;
  path: string;
};

type BreadcrumbsProps = {
  breadcrumbs: Array<BreadcrumbsType>;
};

export const CWBreadcrumbs = (props: BreadcrumbsProps) => {
  const { breadcrumbs } = props;
  const navigate = useNavigate();

  return (
    <div className={ComponentType.Breadcrumbs}>
      {breadcrumbs.map((b, k) => {
        const isCurrent = k === breadcrumbs.length - 1;

        return (
          <React.Fragment key={k}>
            <CWText
              type="caption"
              fontWeight="medium"
              className={isCurrent ? 'current-text' : 'parent-text'}
              onClick={isCurrent ? undefined : () => navigate(b.path)}
            >
              {b.label}
            </CWText>
            {!isCurrent && (
              <CWText
                type="caption"
                fontWeight="medium"
                className="separator-text"
              >
                /
              </CWText>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

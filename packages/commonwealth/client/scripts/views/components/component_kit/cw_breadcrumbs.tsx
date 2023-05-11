import React from 'react';

import 'components/component_kit/cw_breadcrumbs.scss';
import { CWText } from './cw_text';

import { ComponentType } from './types';

type BreadcrumbsType = {
  label: string;
  path?: string;
  navigate?: (url: string) => void;
};

type BreadcrumbsProps = {
  breadcrumbs: Array<BreadcrumbsType>;
};

export const CWBreadcrumbs = (props: BreadcrumbsProps) => {
  const { breadcrumbs } = props;

  return (
    <div className={ComponentType.Breadcrumbs}>
      {breadcrumbs.map(({ label, path, navigate }, k) => {
        const isCurrent = k === breadcrumbs.length - 1;

        return (
          <React.Fragment key={k}>
            <CWText
              type="caption"
              fontWeight="medium"
              className={isCurrent ? 'current-text' : 'parent-text'}
              onClick={isCurrent ? undefined : () => navigate(path)}
            >
              {label}
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

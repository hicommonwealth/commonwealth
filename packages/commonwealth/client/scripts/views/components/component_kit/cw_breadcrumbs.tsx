import clsx from 'clsx';
import React from 'react';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';

import { truncateText } from '../Breadcrumbs/utils';
import './cw_breadcrumbs.scss';
import { CWText } from './cw_text';

import { ComponentType } from './types';

export type BreadcrumbsType = {
  label: string;
  path?: string;
  navigate?: (url: string) => void;
  isParent?: boolean;
};

type BreadcrumbsProps = {
  breadcrumbs: Array<BreadcrumbsType>;
  tooltipStr?: string;
};

const handleNavigation = (label, navigate, isParent) => {
  if (label === 'Discussions' && isParent) {
    navigate(`/discussions`);
  }
};
const handleMouseInteraction = (
  label: string,
  handleInteraction: (event: React.MouseEvent<HTMLSpanElement>) => void,
  event: React.MouseEvent<HTMLSpanElement>,
) => {
  if (label !== 'Discussions') {
    handleInteraction(event);
  }
};

export const CWBreadcrumbs = ({
  breadcrumbs,
  tooltipStr,
}: BreadcrumbsProps) => {
  return (
    <div className={ComponentType.Breadcrumbs}>
      {breadcrumbs.map(({ label, path, navigate, isParent }, index) => {
        const isCurrent = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={index}>
            {isParent && breadcrumbs.length !== 1 ? (
              <CWTooltip
                content={tooltipStr}
                placement="bottom"
                renderTrigger={(handleInteraction) => (
                  <CWText
                    onMouseEnter={(event) =>
                      handleMouseInteraction(label, handleInteraction, event)
                    }
                    onMouseLeave={(event) =>
                      handleMouseInteraction(label, handleInteraction, event)
                    }
                    type="caption"
                    className={clsx({
                      'disable-active-cursor': index === 0,
                      'current-text': isCurrent,
                      'parent-text': !isCurrent,
                    })}
                    onClick={() => handleNavigation(label, navigate, isParent)}
                  >
                    {truncateText(label)}
                  </CWText>
                )}
              />
            ) : (
              <CWText
                type="caption"
                className={isCurrent ? 'current-text' : 'parent-text'}
                // @ts-expect-error <StrictNullChecks/>
                onClick={isCurrent ? undefined : () => navigate(path)}
              >
                {truncateText(label)}
              </CWText>
            )}
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

import React from 'react';

import 'components/component_kit/cw_form_section.scss';

import clsx from 'clsx';
import { CWDivider } from '../../component_kit/cw_divider';
import { CWText } from '../../component_kit/cw_text';

type FormSectionProps = {
  description: string;
  title: string;
  topRightElement?: React.ReactNode;
  className?: string;
} & React.PropsWithChildren;

const Section = ({
  description,
  title,
  topRightElement,
  className,
  children,
}: FormSectionProps) => {
  return (
    <div className="ProfileSection">
      <div className="title">
        <CWText type="h4">{title}</CWText>
        {topRightElement && (
          <div className="top-right-element">{topRightElement}</div>
        )}
      </div>
      <div className="columns">
        <div className="left-side">
          <CWText type="b1">{description}</CWText>
        </div>
        <div className={clsx('right-side', className)}>{children}</div>
      </div>
      <CWDivider />
    </div>
  );
};

export default Section;

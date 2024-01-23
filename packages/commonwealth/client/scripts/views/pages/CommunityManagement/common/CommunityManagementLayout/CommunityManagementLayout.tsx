import React, { ReactNode } from 'react';
import app from 'state';
import Permissions from 'utils/Permissions';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import { PageNotFound } from '../../../404';
import './CommunityManagementLayout.scss';

type CommunityManagementLayout = {
  title: string;
  description: string;
  children: ReactNode;
  featureHint: {
    title: string;
    description: string;
  };
  className?: boolean;
};

const CommunityManagementLayout = ({
  title,
  description,
  children,
  featureHint,
  className,
}: CommunityManagementLayout) => {
  if (
    !app?.user?.activeAccount?.address ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }
  const showAlternateClassname = className ? 'admins-moderators' : '';
  return (
    <section className="CommunityManagementLayout">
      <section className={`left-section ${showAlternateClassname}`}>
        <div className="header">
          <CWText type="h2">{title}</CWText>
          <CWText type="b1">{description}</CWText>
        </div>

        <FeatureHint
          title={featureHint.title}
          hint={featureHint.description}
          className="feature-hint-mobile"
        />

        {children}
      </section>

      <section className="right-section">
        <FeatureHint title={featureHint.title} hint={featureHint.description} />
      </section>
    </section>
  );
};

export default CommunityManagementLayout;

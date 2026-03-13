import React from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import './index.scss';
import { useViewThreadData } from './useViewThreadData';
import { ViewThreadPageShell } from './ViewThreadPageShell';

type ViewThreadPageProps = {
  identifier: string;
};

const ViewThreadPage = ({ identifier }: ViewThreadPageProps) => {
  const data = useViewThreadData({ identifier });

  if (data.viewThreadRenderState === 'fetch_error') {
    return <PageNotFound message={data.fetchThreadError?.message} />;
  }

  if (data.viewThreadRenderState === 'loading') {
    return (
      <CWPageLayout>
        <CWContentPage
          showSkeleton
          sidebarComponentsSkeletonCount={data.isWindowLarge ? 2 : 0}
        />
      </CWPageLayout>
    );
  }

  if (data.viewThreadRenderState === 'thread_not_found') {
    return <PageNotFound message="Thread not found" />;
  }

  return <ViewThreadPageShell data={data} />;
};

export default ViewThreadPage;

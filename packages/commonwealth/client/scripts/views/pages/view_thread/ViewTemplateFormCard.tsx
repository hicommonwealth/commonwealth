import React, { useState } from 'react';
import '../../../../styles/pages/view_thread/ViewTemplateFormCard.scss';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import ViewTemplate from '../view_template/view_template';

type ViewTemplateFormCardProps = {
  address: string;
  slug: string;
};

export const ViewTemplateFormCard = ({
  address,
  slug,
}: ViewTemplateFormCardProps) => {
  const [nickname, setNickname] = useState('Template Form');

  return (
    <CWContentPageCard
      header={nickname}
      content={
        <div className="ViewTemplateFormCard">
          <ViewTemplate
            contract_address={address}
            slug={slug}
            setTemplateNickname={setNickname}
            isForm={true}
          />
        </div>
      }
    />
  );
};

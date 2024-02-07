import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

import './ExternalLink.scss';

interface ExternalLinkProps {
  url: string;
  showIcon?: boolean;
  children: React.ReactNode;
}

export const ExternalLink = ({
  url,
  showIcon = true,
  children,
}: ExternalLinkProps) => {
  const navigate = useCommonNavigate();

  const onClick = (e) => {
    if (url.startsWith(`${document.location.origin}/`)) {
      // don't open a new window if the link is on Commonwealth
      e.preventDefault();
      e.stopPropagation();
      navigate(url);
    }
  };

  return (
    <div className="ExternalLink">
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {children}
      </a>
      {showIcon && <CWIcon iconName="externalLink" iconSize="small" />}
    </div>
  );
};

export default ExternalLink;

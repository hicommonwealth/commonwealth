import 'Layout.scss';
import React from 'react';
import { Helmet } from 'react-helmet-async';

type MetaTagName =
  | 'application-name'
  | 'title'
  | 'author'
  | 'description'
  | 'generator'
  | 'keywords'
  | 'viewport'
  | 'robots'
  | 'referrer'
  | 'format-detection'
  | 'apple-mobile-web-app-title'
  | 'theme-color'
  | 'twitter:card'
  | 'twitter:title'
  | 'twitter:description'
  | 'twitter:image'
  | 'twitter:site'
  | 'twitter:url'
  | 'twitter:creator'
  | 'og:title'
  | 'og:description'
  | 'og:type'
  | 'og:image'
  | 'og:url'
  | 'og:site_name'
  | 'og:locale';

type MetaTagProperty =
  | 'og:title'
  | 'og:description'
  | 'og:type'
  | 'og:image'
  | 'og:url'
  | 'og:site_name'
  | 'og:locale';

type MetaTagsProps = {
  customMeta?: {
    name?: MetaTagName;
    property?: MetaTagProperty;
    content: string;
  }[];
};

// These are the default meta tags for each page
const defaultMeta = {
  title: {
    name: 'title',
    content: 'Common',
  },
  description: {
    name: 'description',
    content: 'Discuss, organize, and grow decentralized communities',
  },
  author: {
    name: 'author',
    content: '',
  },
  'twitter:card': {
    name: 'twitter:card',
    content: 'summary',
  },
  'twitter:title': {
    name: 'twitter:title',
    content: 'Common',
  },
  'twitter:site': {
    name: 'twitter:site',
    content: '@hicommonwealth',
  },
  'twitter:description': {
    name: 'twitter:description',
    content: 'Discuss, organize, and grow decentralized communities',
  },
  'twitter:image': {
    name: 'twitter:image',
    content: 'https://commonwealth.im/static/img/branding/common.png',
  },
  'og:type': {
    property: 'og:type',
    content: 'website',
  },
  'og:site_name': {
    property: 'og:site_name',
    content: 'Common',
  },
  'og:url': {
    property: 'og:url',
    content: 'https://commonwealth.im',
  },
  'og:title': {
    property: 'og:title',
    content: 'Common',
  },
  'og:description': {
    property: 'og:description',
    content: 'Discuss, organize, and grow decentralized communities',
  },
  'og:image': {
    property: 'og:image',
    content: 'https://commonwealth.im/static/img/branding/common.png',
  },
};

const MetaTags = ({ customMeta }: MetaTagsProps) => {
  // make a unique aggregate of meta tags
  const finalMeta = (() => {
    const tempMeta = { ...defaultMeta };

    customMeta?.map((meta) => {
      if (meta.name && typeof meta.content === 'string') {
        tempMeta[meta.name] = meta;
      }

      if (meta.property && typeof meta.content === 'string') {
        tempMeta[meta.property] = meta;
      }
    });

    return Object.values(tempMeta);
  })();

  return (
    <Helmet>
      {finalMeta.map((meta: any, index) => (
        <meta
          key={index}
          {...(meta.name && {
            name: meta.name,
          })}
          {...(meta.property && {
            property: meta.property,
          })}
          content={meta.content}
        />
      ))}
    </Helmet>
  );
};

export default MetaTags;

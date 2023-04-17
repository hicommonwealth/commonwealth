const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const featureFlags = {
  proposalTemplates: !IS_PRODUCTION,
};

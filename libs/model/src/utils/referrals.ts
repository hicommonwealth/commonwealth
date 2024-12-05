export function getReferrerId(referral_link?: string | null) {
  return referral_link?.startsWith('ref_')
    ? parseInt(referral_link.split('_').at(1)!)
    : undefined;
}

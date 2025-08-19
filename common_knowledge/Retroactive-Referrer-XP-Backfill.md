# Retroactive Referrer XP Backfill

## Summary
- Award referrer bonuses for historical XP logs by looking up each user's `referred_by_address` in the database.
- Grant referrers an extra 10% of each action's reward without deducting from the original actor's XP.
- Only credit the difference between the expected bonus and the referrer's existing `xp_referrer_points`.

## Acceptance Criteria
- Script `libs/model/scripts/backfill-referrer-xp.ts` computes historical referral totals and increments referrers accordingly.
- Running the script is idempotent and never reduces any user's XP.
- Ticket created to track implementation of the retroactive XP backfill.

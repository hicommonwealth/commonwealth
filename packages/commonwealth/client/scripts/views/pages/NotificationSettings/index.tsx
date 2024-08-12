import { CommunityAlert } from '@hicommonwealth/schemas';
import { z } from 'zod';
import './index.scss';

type NotificationSection = 'community-alerts' | 'threads' | 'comments';

const NotificationSettings = () => {
  // const supportsPushNotifications = useSupportsPushNotifications();
  // const threadSubscriptions = useThreadSubscriptions();
  // const communityAlerts = useCommunityAlertsQuery();
  // const enableKnockPushNotifications = useFlag('knockPushNotifications');
  // const { isLoggedIn } = useUserLoggedIn();
  //
  // const communityAlertsIndex = createIndexForCommunityAlerts(
  //   (communityAlerts.data as unknown as ReadonlyArray<
  //     z.infer<typeof CommunityAlert>
  //   >) || [],
  // );
  //
  // const [section, setSection] =
  //   useState<NotificationSection>('community-alerts');
  //
  // if (threadSubscriptions.isLoading) {
  //   return <PageLoading />;
  // } else if (!isLoggedIn) {
  //   return <PageNotFound />;
  // }
  //
  // return (
  //   <CWPageLayout>
  //     <div className="NotificationSettingsPage NotificationSettings">
  //       <CWText type="h3" fontWeight="semiBold" className="page-header-text">
  //         Notification settings
  //       </CWText>
  //
  //       <CWText className="page-subheader-text">
  //         Manage the emails and alerts you receive about your activity
  //       </CWText>
  //
  //       {enableKnockPushNotifications && supportsPushNotifications && (
  //         <div>
  //           <CWText type="h5">Push Notifications</CWText>
  //
  //           <div className="setting-container">
  //             <div className="setting-container-left">
  //               <CWText className="text-muted">
  //                 Turn on notifications to receive alerts on your device.
  //               </CWText>
  //             </div>
  //
  //             <div className="setting-container-right">
  //               <PushNotificationsToggle />
  //             </div>
  //           </div>
  //         </div>
  //       )}
  //
  //       <CWTabsRow>
  //         <CWTab
  //           label="Community"
  //           isSelected={section === 'community-alerts'}
  //           onClick={() => setSection('community-alerts')}
  //         />
  //         <CWTab
  //           label="Threads"
  //           isSelected={section === 'threads'}
  //           onClick={() => setSection('threads')}
  //         />
  //
  //         <CWTab
  //           label="Comments"
  //           isSelected={section === 'comments'}
  //           onClick={() => setSection('comments')}
  //         />
  //       </CWTabsRow>
  //
  //       {!communityAlerts.isLoading && section === 'community-alerts' && (
  //         <>
  //           <CWText type="h4" fontWeight="semiBold" className="section-header">
  //             Community Alerts
  //           </CWText>
  //
  //           <CWText className="page-subheader-text">
  //             Get updates on onchain activity and proposals in these
  //             communities.
  //           </CWText>
  //
  //           {getUniqueCommunities().map((community) => {
  //             return (
  //               <CommunityEntry
  //                 key={community.id}
  //                 communityInfo={community}
  //                 communityAlert={communityAlertsIndex[community.id]}
  //               />
  //             );
  //           })}
  //         </>
  //       )}
  //
  //       {section === 'threads' && (
  //         <>
  //           <ThreadSubscriptions />
  //         </>
  //       )}
  //
  //       {section === 'comments' && (
  //         <>
  //           <CommentSubscriptions />
  //         </>
  //       )}
  //     </div>
  //   </CWPageLayout>
  // );
  return null;
};

function createIndexForCommunityAlerts(
  communityAlerts: ReadonlyArray<z.infer<typeof CommunityAlert>>,
): Readonly<{ [id: string]: z.infer<typeof CommunityAlert> }> {
  const result: { [id: string]: z.infer<typeof CommunityAlert> } = {};
  communityAlerts.forEach(
    (current) => (result[current.community_id] = current),
  );
  return result;
}

export default NotificationSettings;

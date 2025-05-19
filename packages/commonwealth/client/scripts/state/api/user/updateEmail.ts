//import { DynamicTemplate, PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
//import sgMail from '@sendgrid/mail';
//import { notifyError, notifyInfo } from 'controllers/app/notifications';
//import { config } from 'server/config';
import { trpc } from 'utils/trpcClient';
//import { userStore } from '../../ui/user';

// config.SENDGRID.API_KEY && sgMail.setApiKey(config.SENDGRID.API_KEY);

// export const onUpdateEmailSuccess = async ({
//   email,
//   update_token,
// }: {
//   email: string;
//   update_token: string;
// }) => {
//   const loginLink = `${config.SERVER_URL}/api/finishUpdateEmail?token=${
//     update_token
//   }&email=${encodeURIComponent(email)}`;

//   const msg = {
//     to: email,
//     from: `Commonwealth <no-reply@${PRODUCTION_DOMAIN}>`,
//     subject: 'Verify your Commonwealth email',
//     templateId: DynamicTemplate.UpdateEmail,
//     dynamic_template_data: { loginLink },
//   };

//   try {
//     await sgMail.send(msg);
//     userStore.getState().setData({ email });
//     notifyInfo('Sent update email');
//   } catch (e) {
//     notifyError(`Could not send authentication email: ${loginLink}`);
//   }
// };

// export const onUpdateEmailError = (shouldNotifyFailure: boolean) =>
//   shouldNotifyFailure && notifyError('Unable to update email');

const useUpdateUserEmailMutation = ({
  shouldNotifyFailure = true,
}: {
  shouldNotifyFailure?: boolean;
}) => {
  return trpc.user.updateEmail.useMutation({
    //onSuccess: (user) => onUpdateEmailSuccess(user),
    //onError: () => onUpdateEmailError(shouldNotifyFailure),
  });
};

export default useUpdateUserEmailMutation;

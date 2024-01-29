import { notifySuccess } from 'controllers/app/notifications';

export const saveToClipboard = async (
  content: string,
  successNotification = false,
) => {
  try {
    await navigator.clipboard.writeText(content);
    successNotification && notifySuccess('Copied');
  } catch (err) {
    console.log(err);
  }
};

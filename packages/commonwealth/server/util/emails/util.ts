import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import sgMail from '@sendgrid/mail';

const log = loggerFactory.getLogger(formatFilename(__filename));

/**
 * This function sends the same email individually to multiple recipients. Note that
 * the recipients will not be able to see each other.
 */
export async function sendEmails(emailObject: MailDataRequired) {
  if (!emailObject) {
    log.warn('Attempted to send empty immediate notification emails');
    return;
  }

  try {
    // the 2nd parameter must be set to true to ensure recipients don't see each other
    await sgMail.send(emailObject, true);
  } catch (e) {
    log.error(
      'Failed to send immediate notification email',
      e?.response?.body?.errors,
    );
  }
}

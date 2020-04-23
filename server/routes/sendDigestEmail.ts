import { default as sgMail } from '@sendgrid/mail';
// import QuillFormattedText from '../../client/scripts/views/components/quill_formatted_text';
// import MarkdownFormattedText from '../../client/scripts/views/components/markdown_formatted_text';
import { SERVER_URL } from '../config';
// import toPlaintext from 'quill-delta-to-plaintext';
// const removeMd = require('remove-markdown');
// const QuillToPlaintext = require('quill-to-plaintext');


function slugify(str : string) {
  // remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes
  return str.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

const sendDigestEmail = async (models, req, res, next) => {

  if (!req.user && !req.user.isAdmin) {
    return next(new Error('Not logged in or Site Admin'));
  }

  const selectedFlags = await models.DigestFlag.findAll({
    where: {
      selected: true,
      active: true,
    }
  });
  if (selectedFlags.length === 0) return next(new Error('No Threads Selected or, Failed to retrieve selected flags'));
  selectedFlags.sort((a, b) => (a.votes < b.votes) ? 1 : -1);

  // get threads
  const threads = await Promise.all(selectedFlags.map((flag) => {
    const { offchain_thread_id } = flag;
    return models.OffchainThread.findOne({
      where: {
        id: offchain_thread_id,
      }
    });
  }));
  if (threads.length < 1) { return next(new Error('Failed to find threads associated with flags')); }

  // construct thread rows for email
  const threadTexts = [];

  await Promise.all(threads.map((thread: any) => {
    // let innerText: string;
    // try {
    //   const doc = JSON.parse(thread.body);
    //   const defeathered = toPlaintext(doc);
    //   // innerText = component.children.toString();
    // } catch (e) {
    //   const demarkdowned = removeMd(thread.body);
    //   console.dir(demarkdowned);
    // }
    const link = `${SERVER_URL}/${thread.community}/proposal/discussion/${thread.id}-${slugify(decodeURIComponent(thread.title))}`;
    const text = `<li><a href="${link}"><h3>${thread.title}:</h3></a></li>`;
    threadTexts.push(text);
  }));

  // constructing the email:
  let message = '';
  message += '<h1>Weekly Digest from Commonwealth</h1>';
  message += '<p>Below are a handful of threads we think you might enjoy</p>';
  message += '<ul>';
  threadTexts.map((text) => {
    message += text;
  });
  message += '</ul>';

  // Sending Email

  // COMMENT OUT FOR PRODUCTION
  // send email
  // const allUsers = await models.User.findAll({
  //   where: {
  //     email: {
  //       [Op.ne]: null,
  //     },
  //   }
  // });

  // For Testing as Admin (SENDS TO LOGGED IN ADMIN ONLY)
  const allUsers = await models.User.findAll({
    where: {
      id: req.user.id,
    }
  });

  allUsers.map(async (user) => {
    try {
      const msg = {
        to: user.email,
        from: 'Commonwealth <no-reply@commonwealth.im>',
        subject: 'Commonwealth Weekly Digest',
        text: `${message}`,
        html: `${message}`,
      };
      const mes = await sgMail.send(msg);
    } catch (e) {
      console.error(e.mes);
    }
  });

  return res.json({ status: 'Success', result: threadTexts });
};

export default sendDigestEmail;

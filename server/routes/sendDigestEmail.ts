import { default as sgMail } from '@sendgrid/mail';
import setGlobals from '../util/setGlobals';
import QuillFormattedText from '../../client/scripts/views/components/quill_formatted_text';
import MarkdownFormattedText from '../../client/scripts/views/components/markdown_formatted_text';
import { SERVER_URL } from '../config';
setGlobals();
const render = require('mithril-node-render');
const m = require('mithril');

const sendDigestEmail = async (models, req, res, next) => {

  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  // check if SiteAdmin


  const selectedFlags = await models.DigestFlag.findAll({
    where: {
      selected: true,
      active: true,
    }
  });
  if (selectedFlags.length === 0) return next(new Error('Failed to retrieve selected flags'));
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
  console.dir('threads');
  console.dir(threads);
  // TODO: reference the function in the file, throwing weird mithril error to server when I do now.
  function slugify(str : string) {
    // remove any character that isn't a alphanumeric character or a
    // space, and then replace any sequence of spaces with dashes
    return str.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
  }
  // construct thread rows for email
  const threadTexts = [];

  await Promise.all(threads.map((thread: any) => {
    let innerText: string;
    let component;
    try {
      const doc = JSON.parse(thread.body);
      console.dir('doc');
      console.dir(doc);
      component = render(m(QuillFormattedText, { doc }));
      console.dir(component);
      innerText = component.children.toString();
      console.dir(innerText);
    } catch (e) {
      console.dir('Error');
      component = render(m(MarkdownFormattedText, { doc: thread.body }));
      console.dir(innerText);
    }
    console.dir(innerText);
    const link = `${SERVER_URL}/${thread.community}/proposal/discussion/${thread.id}-${slugify(decodeURIComponent(thread.title))}`; // TODO: FIX THIS
    const text = `<li><a href="${link}"><h3>${thread.title}:</h3><p>${innerText}...</p></a></li>`;
    threadTexts.push(text);
  }));
  console.dir(threadTexts);

  // constructing the email:
  let message = '';
  message += '<ul>';
  threadTexts.map((text) => {
    message += text;
  });
  message += '</ul>';

  // Sending Email

  // FOR PRODUCTION
  // send email
  // const allUsers = await models.User.findAll({
  //   where: {
  //     email: {
  //       [Op.ne]: null,
  //     },
  //   }
  // });

  // For Testing as Admin (SENDS TO ADMIN)
  const allUsers = await models.User.findAll({
    where: {
      id: req.user.id,
    }
  });
  console.dir(allUsers);
  allUsers.map(async (user) => {
    try {
      const msg = {
        to: user.email,
        from: 'Commonwealth <no-reply@commonwealth.im>',
        subject: 'Commonwealth Weekly Digest',
        text: `${message}`,
        html: `${message}`,
        // mail_settings: {
          // sandbox_mode: {
          //   enable: (process.env.NODE_ENV === 'development'),
          // }
        // },
      };
      const mes = await sgMail.send(msg);
    } catch (e) {
      console.error(e.mes);
    }
  });


  return res.json({ status: 'Success', result: threadTexts });
};

export default sendDigestEmail;

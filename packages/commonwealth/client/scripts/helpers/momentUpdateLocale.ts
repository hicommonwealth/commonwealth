import moment from 'moment/moment';

const momentUpdateLocale = () => {
  // set up moment-twitter
  moment.updateLocale('en', {
    relativeTime: {
      // NOTE: This makes relative date display impossible for all
      // future dates, e.g. when displaying how long until an offchain
      // poll closes.
      future: 'just now',
      past: '%s ago',
      s: (num, withoutSuffix) => (withoutSuffix ? 'now' : 'seconds'),
      m: '1 min',
      mm: '%d min',
      h: '1 hour',
      hh: '%d hours',
      d: '1 day',
      dd: '%d days',
      M: '1 month',
      MM: '%d months',
      y: '1 year',
      yy: '%d years',
    },
  });
};

export default momentUpdateLocale;

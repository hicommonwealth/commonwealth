// import passportCustom from 'passport-custom';
// import {models} from "@hicommonwealth/model";
// import express from "express";

// const CustomStrategy = passportCustom.Strategy;

// export function initTokenAuth() {
//   passport.use(
//     'authtoken',
//     new AuthTokenStrategy(
//       {
//         tokenFields: ['knock_auth_token', 'KNOCK_AUTH_TOKEN'],
//         headerFields: ['knock_auth_token', 'KNOCK_AUTH_TOKEN'],
//         optional: false,
//       },
//       function (token, done) {
//         switch (token) {
//           case config.NOTIFICATIONS.KNOCK_AUTH_TOKEN:
//             done(null, {
//               id: ExternalServiceUserIds.Knock,
//               email: 'hello@knock.app',
//             });
//             break;
//           default:
//             done(null, false);
//             break;
//         }
//       },
//     ),
//   );
// }

// export function initTokenAuth() {
//   console.log('authToken strategy set up');
//   passport.use('authtoken', new CustomStrategy(
//     function(req, done) {
//       console.log(req.headers);
//       done(null, models.User.build({
//         id: ExternalServiceUserIds.Knock,
//         email: 'hello@knock.app',
//       }));
//       // switch (req.headers['authorization']) {
//       //   case config.NOTIFICATIONS.KNOCK_AUTH_TOKEN:
//       //     done(null, {
//       //       id: ExternalServiceUserIds.Knock,
//       //       email: 'hello@knock.app',
//       //     });
//       //     break;
//       //   default:
//       //     done(null, false);
//       //     break;
//       // }
//     }
//   ))
// }

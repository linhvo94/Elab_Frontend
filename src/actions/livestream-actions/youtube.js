import { DISCOVERY_DOCS, CLIENT_ID, SCOPES } from "../../environment/youtube-constants";

// export function handleGoogleClientLoad() {
//     return new Promise((resolve, reject) => {
//         resolve(window.gapi.load('client:auth2', initClient))
//     })
// }

// export function initClient() {
//     window.gapi.client.init({
//         discoveryDocs: DISCOVERY_DOCS,
//         clientId: CLIENT_ID,
//         scope: SCOPES
//     }).then(() => {
//         return window.gapi.auth2.getAuthInstance();
//     });
// }

// export function initClient() {
//     window.gapi.client.init({
//         discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
//         clientId: "303172413023-lq0i18prdi3lp5tg9u2hlqn9m5ou71ao.apps.googleusercontent.com",
//         scope: "https://www.googleapis.com/auth/youtube.readonly"
//     }).then(() => {
//         GoogleAuth.window.gapi.auth2.getAuthInstance();
//         GoogleAuth.isSignedIn.listen(updateSigninStatus);
//     });
// }

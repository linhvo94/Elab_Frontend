import { CLIENT_ID, DISCOVERY_DOCS, SCOPES } from "../../environment/youtube-constants";

// const handleClientLoad =  () =>{
//     window.gapi.load("client:auth2", initClient);
// }

// const initClient = () => {
//     window.gapi.client.init({
//         discoveryDocs: DISCOVERY_DOCS,
//         clientId: CLIENT_ID,
//         scope: SCOPES
//     }).then(() => {
//         console.log("INIT SUCCESSFULLY");
//         // window.gapi.auth2.getAuthInstance().isSignedIn.listen(handleAuthStatus);
//         // handleAuthStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
//     });
// }

const handleAuthStatus = (isSignedIn) => {
    if (isSignedIn) {
        window.gapi.auth2.getAuthInstance().signIn();
    }
}

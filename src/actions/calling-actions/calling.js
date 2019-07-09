import { SIGNALING_SERVER_URL } from "../../api-urls/signaling-api.js";
// import { servers } from "../../servers-config/websocket-config.js.js";

export const connectToSignalingServer = (user) => {
    const wss = new WebSocket(SIGNALING_SERVER_URL);
    wss.onopen = () => {
        console.log('Client is open');

    }

    wss.onmessage = (message) => {
        console.log(message.data);
    }

    // wss.onmessage = () => {
    //     wss.send("Hello from Client");
    // }
}

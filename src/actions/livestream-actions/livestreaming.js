import Janus from "../../janus-utils/janus.js";
import { JANUS_SERVER_HTTP, JANUS_SERVER_HTTPS } from "../../environment/janus-urls.js";
import {
    FETCH_ALL_LIVESTREAMS_SUCCESSFULLY, CREATE_ROOM_SUCCESSFULLY, FETCH_A_LIVESTREAM_SUCCESSFULLY, LIVESTREAM_NOT_FOUND
} from "../../action-types/livestream-types.js";

export const initJanus = () => {
    return new Promise((resolve, reject) => {
        let opaqueID = `videoroom - ${Janus.randomString(12)}`;
        Janus.init({
            debug: "all",
            callback: () => {
                if (!Janus.isWebrtcSupported) {
                    alert("Your browser does not support WebRTC. Please try different browser.");
                    return;
                } else {
                    let janus = new Janus({
                        server: JANUS_SERVER_HTTPS,
                        iceServers: [{ urls: "stun:e-lab.host:5349" }, { urls: "turn:e-lab.host:5349?transport=udp", username: "lcq", credential: "lcq" }, { urls: "turn:e-lab.host:5349?transport=tcp", username: "lcq", credential: "lcq" }],
                        success: () => {
                            console.log("=== success connect ===");
                            janus.attach({
                                plugin: "janus.plugin.videoroom",
                                opaqueID: opaqueID,
                                success: (pluginHandle) => {
                                    Janus.log(`[Video Room] plugin attached!(${pluginHandle.getPlugin()}, id = ${pluginHandle.getId()})`);
                                    resolve(pluginHandle);
                                }
                            });
                        },
                        error: (error) => {
                            reject(error);
                        }
                    });
                }
            }
        })
    });
}


export function fetchAllLiveStreams() {
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        fetch(`http://localhost:8080/get-livestreams?access_token=${access_token}`)
            .then((res) => { return res.json() })
            .then((data) => {
                dispatch({
                    type: FETCH_ALL_LIVESTREAMS_SUCCESSFULLY,
                    payload: data
                })
            })
    }
}

export function createLiveStream(liveStream) {
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        // https://www.e-lab.live:8080/api/create-livestream?access_token${access_token}
        fetch(`http://localhost:8080/create-livestream?access_token=${access_token}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(liveStream)
        })
            .then(res => {
                console.log(res.status);
                if (res.status === 200) {
                    dispatch({
                        type: CREATE_ROOM_SUCCESSFULLY,
                        payload: true
                    });
                } else if (res.status === 400) {

                    // return res.text();
                } else if (res.status === 409) {

                    // return res.text();
                }
            })
    }
}

export function getALiveStream(id) {
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        fetch(`http://localhost:8080/get-livestream-by-room/${id}?access_token=${access_token}`)
            .then((res) => res.text())
            .then((text) => {
                console.log(text);
                if(text.length) {
                    dispatch({
                        type: FETCH_A_LIVESTREAM_SUCCESSFULLY,
                        payload: JSON.parse(text)
                    });
                } else {
                    console.log("Live stream not found");
                    dispatch({
                        type: LIVESTREAM_NOT_FOUND,
                        payload: "Live stream not found"
                    });
                }
            })
            .catch((error) => {
                throw error;
            });
    }
}
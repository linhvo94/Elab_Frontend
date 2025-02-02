import Janus from "../../utils/janus-utils/janus.js";
import { JANUS_SERVER_HTTP, JANUS_SERVER_HTTPS, JANUS_SERVER_WSS, JANUS_SERVER_WS } from "../../environment/janus-urls.js";
import {
    FETCH_ALL_LIVESTREAMS_SUCCESSFULLY, CREATE_ROOM_SUCCESSFULLY, FETCH_A_LIVESTREAM_SUCCESSFULLY, LIVESTREAM_NOT_FOUND
} from "../../action-types/livestream-types.js";
import { iceServerConfig } from "../../environment/ice-server-config.js";

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
                        // server: JANUS_SERVER_WS,
                        // server: JANUS_SERVER_WSS,
                        server: JANUS_SERVER_HTTPS,
                        iceServers: iceServerConfig.iceServers,
                        success: () => {
                            console.log("=== success connect ===");
                            janus.attach({
                                plugin: "janus.plugin.videoroom",
                                opaqueID: opaqueID,
                                success: (pluginHandle) => {
                                    Janus.log(`[Video Room] plugin attached!(${pluginHandle.getPlugin()}, id = ${pluginHandle.getId()})`);
                                    let body = { request: "list" };
                                    pluginHandle.send({
                                        message: body, success: (message) => {
                                            console.log("ROOM", message);
                                        }
                                    });
                                    resolve({ janus: janus, sfu: pluginHandle });
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
        fetch(`https://www.e-lab.live:8080/api/get-livestreams?access_token=${access_token}`)
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
    console.log("CREATE STREAM");
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        // https://www.e-lab.live:8080/api/create-livestream?access_token${access_token}
        fetch(`https://www.e-lab.live:8080/api/create-livestream?access_token=${access_token}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(liveStream)
        })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                } else if (res.status === 400) {

                    // return res.text();
                } else if (res.status === 409) {

                    // return res.text();
                }
            })
            .then(data => {
                console.log("livestream created", data);
                dispatch({
                    type: CREATE_ROOM_SUCCESSFULLY,
                    payload: data
                });
            }).catch(e => console.log(e));
    }
}

export function updateALiveStream(liveStream) {
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        fetch(`https://www.e-lab.live:8080/api/update-livestream?access_token=${access_token}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'PUT',
            body: JSON.stringify(liveStream)
        })
            .then(res => {
                console.log(res.status);
                if (res.status === 200) {
                    dispatch(getALiveStream(liveStream.id));
                }
            })
    }
}

export function getALiveStream(id) {
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        fetch(`https://www.e-lab.live:8080/api/get-livestreams/${id}?access_token=${access_token}`)
            .then((res) => res.text())
            .then((text) => {
                console.log(text);
                if (text.length > 0) {
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

export const deleteALiveStream = (id) => {
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        fetch(`https://www.e-lab.live:8080/api/delete-livestream/${id}?access_token=${access_token}`, {
            method: 'DELETE'
        })
            .then((res) => { return res.text() })
            .then((data) => {
                dispatch(fetchAllLiveStreams())
            })
    }
}

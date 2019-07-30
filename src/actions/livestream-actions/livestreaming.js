import Janus from "../../janus-utils/janus.js";
import { JANUS_SERVER_HTTP, JANUS_SERVER_HTTPS } from "../../environment/janus-urls.js";

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
                                // opaqueID: opaqueID,
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
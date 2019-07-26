import React from "react";
import uuid from "uuid/v4";
import Janus from "../../janus-utils/janus.js";


export default class LiveStream extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomID: ""
        }
        this.janus = null;
        this.janusServer = "http://e-lab.host:8088/elab";
        this.opaqueID = `videoroom-${Janus.randomString(12)}`;
        this.sfu = null;
        this.initializeJanus = null;
        this.participantID = "";
        this.participantPrivateID = "";
        this.localStreamSrc = React.createRef();
        this.remoteStreamSrc = React.createRef();
        this.localStream = null;
        this.remoteStream = null;
        this.done = false;

    }

    componentDidMount() {
        // this.initJanus();
    }

    generateRoom = () => {
        return new Promise((resolve, reject) => {
            // let roomID = Math.floor(Math.random() * 123456789);
            let roomConfig = { request: "create", room: 456, permanent: false, description: "Broadcast room" };
            this.sfu.send({
                message: roomConfig,
                success: (message) => {
                    console.log("=== room created === ", message);
                    this.setState({ roomID: message.room });
                    resolve(message);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }

    initJanus = () => {
        Janus.init({
            debug: "all",
            callback: () => {
                if (!Janus.isWebrtcSupported) {
                    alert("Your browser does not support WebRTC. Please try different browser.");
                    return;
                } else {
                    this.janus = new Janus({
                        server: this.janusServer,
                        success: () => {
                            console.log("=== success connect ===");
                            this.janus.attach({
                                plugin: "janus.plugin.videoroom",
                                opaqueID: this.opaqueID,
                                success: (pluginHandle) => {
                                    this.sfu = pluginHandle;
                                    Janus.log(`[Video Room] plugin attached! (${this.sfu.getPlugin()}, id=${this.sfu.getId()})`);

                                    // this.generateRoom().then(message => {
                                    //     let publisherConfig = { request: "join", ptype: "publisher", room: message.room, display: `${this.state.firstName} ${this.state.lastName}` };
                                    //     this.sfu.send({ message: publisherConfig });
                                    // });
                                    let publisherConfig = { request: "join", ptype: "publisher", room: 456, id: 123, display: `Linh Vo` };
                                    this.sfu.send({ message: publisherConfig });

                                },
                                error: (error) => {
                                    Janus.error("  -- Error attaching plugin...", error);
                                    console.log("Error attaching plugin... " + error);
                                },
                                consentDialog: (on) => {

                                },
                                mediaState: (medium, on) => {

                                },
                                webrtcState: (on) => {

                                },
                                onmessage: (message, jsep) => {
                                    Janus.log("::: Got a message (publisher) :::");
                                    Janus.log("MESSAGE: ", message);
                                    let event = message.videoroom;
                                    Janus.debug("Event: " + event);

                                    if (event !== undefined && event !== null) {
                                        if (event === "joined") {
                                            console.log("id ", message.id, "private: ", message.private_id);
                                            this.participantID = message.id;
                                            this.participantPrivateID = message.private_id;
                                            Janus.log("Successfully joined room " + message.room + " with ID " + this.participantID);

                                            this.publishOwnFeed(true);

                                            // setTimeout(() => {
                                            //     let body = { request: "list" };
                                            //     this.sfu.send({
                                            //         message: body, success: (message) => {
                                            //             console.log("LISTTTTTTTTTTT : ", message);
                                            //         }
                                            //     });
                                            // }, 3000);


                                            if (message.publishers !== undefined && message.publishers !== null) {
                                                let publisherList = message.publishers;
                                                Janus.log("Got a list of available publishers/feeds:");
                                                Janus.log(publisherList);

                                                publisherList.forEach(publisher => {
                                                    let id = publisher.id;
                                                    let display = publisher.display;
                                                    let audio = publisher.audio_codec;
                                                    let video = publisher.video_codec;
                                                    Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                                    this.newRemoteFeed(id, display, audio, video);
                                                });
                                            }
                                        } else if (event === "event") {
                                            console.log("HELLOO NEW EVENT");
                                            // if (!this.done) {
                                            //     this.audio = message.audio_codec;
                                            //     this.video = message.video_codec;
                                            //     // this.newRemoteFeed(this.participantID, "linhvo", message.audio_codec, message.video_codec);
                                            //     this.done = true;
                                            // }
                                            // if (message.publishers !== undefined && message.publishers !== null) {
                                            //     let publisherList = message.publishers;
                                            //     Janus.log("Got a list of available publishers/feeds:\n");
                                            //     Janus.log(publisherList);


                                            //     publisherList.forEach(publisher => {
                                            //         let id = publisher.id;
                                            //         let display = publisher.display;
                                            //         let audio = publisher.audio_codec;
                                            //         let video = publisher.video_codec;
                                            //         Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                            //         this.newRemoteFeed(id, display, audio, video);
                                            //     });
                                            // }
                                        }
                                    }

                                    if (jsep !== undefined && jsep !== null) {
                                        Janus.log("Handling SDP as well...");
                                        Janus.debug(jsep);
                                        this.sfu.handleRemoteJsep({ jsep: jsep });
                                    }
                                },
                                onlocalstream: (stream) => {
                                    Janus.log(" ::: Got a local stream ::: ", stream);
                                    this.localStreamSrc.current.srcObject = stream;
                                    this.localStream = stream;
                                }

                            });
                        },
                    });
                }
            }
        });
    }

    publishOwnFeed = (useAudio) => {
        this.sfu.createOffer({
            media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true },
            success: (jsep) => {
                Janus.log("Got publisher SDP!");
                let publish = { request: "configure", "audio": useAudio, "video": true };
                this.sfu.send({ message: publish, jsep: jsep });
            },
            error: (error) => {
                Janus.error("WebRTC error: ", error);
                if (useAudio) {
                    this.publishOwnFeed(false)
                } else {
                    console.log("WebRTC error... " + JSON.stringify(error));
                }
            }
        });
    }

    newRemoteFeed = () => {
        Janus.init({
            debug: "all",
            callback: () => {
                if (!Janus.isWebrtcSupported) {
                    alert("Your browser does not support WebRTC. Please try different browser.");
                    return;
                } else {
                    this.janus = new Janus({
                        server: this.janusServer,
                        success: () => {
                            console.log("=== success connect ===");
                            let remoteFeed = null;
                            this.janus.attach({
                                plugin: "janus.plugin.videoroom",
                                opaqueId: this.opaqueID,
                                success: (pluginHandle) => {
                                    remoteFeed = pluginHandle;
                                    // remoteFeed.simulcastStarted = false;
                                    Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
                                    Janus.log("  -- This is a subscriber --- ");
                                    let subscriberConfig = { request: "join", ptype: "subscriber", room: 456, feed: 123 };

                                    // if (Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                                    //     (video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
                                    //     if (video) {
                                    //         video = "vp8".toUpperCase();
                                    //     }
                                    //     Janus.warning("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
                                    // }

                                    remoteFeed.videoCodec = "vp8";
                                    remoteFeed.send({ message: subscriberConfig });
                                },
                                error: (error) => {
                                    Janus.error("  -- Error attaching plugin...", error);
                                },
                                onmessage: (message, jsep) => {
                                    Janus.log(" ::: Got a message (subscriber) :::");
                                    Janus.log(message);
                                    let event = message.videoroom;

                                    Janus.log("Event: " + event);
                                    if (message.error !== undefined && message.error !== null) {
                                        Janus.debug("Error: " + message.error);
                                    } else if (event !== undefined && event !== null) {
                                        if (event !== "attached") {

                                        }
                                    }

                                    if (jsep !== undefined && jsep !== null) {
                                        Janus.log("Handling SDP as well...");
                                        remoteFeed.createAnswer(
                                            {
                                                jsep,
                                                // Add data:true here if you want to subscribe to datachannels as well
                                                // (obviously only works if the publisher offered them in the first place)
                                                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                                                success: (jsep) => {
                                                    Janus.debug('[VideoRoom][Remote] Got SDP!');
                                                    Janus.debug(`[VideoRoom][Remote] ${jsep}`);
                                                    const body = { request: 'start', room: 456 };
                                                    remoteFeed.send({ message: body, jsep });
                                                },
                                                error: (error) => {
                                                    Janus.error('[VideoRoom][Remote] WebRTC error:', error);
                                                },
                                            }
                                        );
                                        // remoteFeed.createAnswer({
                                        //     jsep: jsep,
                                        //     media: { audioSend: false, videoSend: false },
                                        //     success: (jsep) => {
                                        //         let body = { request: "start" };
                                        //         remoteFeed.send({ message: body, jsep: jsep  });
                                        //     },
                                        //     error: (error) => {
                                        //         Janus.log("Error: ", error);
                                        //     }
                                        // });
                                    }
                                },
                                webrtcState: (on) => {

                                },
                                onlocalstream: (stream) => {
                                    Janus.log(" ::: Got a local stream :::");
                                },
                                onremotestream: (stream) => {
                                    Janus.log(" ::: Got a remote stream ::: ", stream);
                                    this.remoteStreamSrc.current.srcObject = stream;
                                    this.remoteStream = stream;
                                }
                            });
                        }
                    })
                }
            }
        })
    }


    subscribe = (e) => {
        e.preventDefault();
        this.newRemoteFeed();
    }

    publish = (e) => {
        e.preventDefault();
        this.initJanus();
    }

    render() {
        return (
            <React.Fragment>
                <video ref={this.localStreamSrc} autoPlay muted style={{
                    width: "240px",
                    height: "180px"
                }} />

                <video ref={this.remoteStreamSrc} autoPlay style={{
                    width: "240px",
                    height: "180px"
                }} />

                <button onClick={this.publish}>Publish</button>
                <button onClick={this.subscribe}>Subscribe</button>
            </React.Fragment>
        );
    }
}
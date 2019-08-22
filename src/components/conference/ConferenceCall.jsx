import React from "react";
import io from "socket.io-client";
import Janus from "../../utils/janus-utils/janus.js";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { sendAddOnlineUserEvent, sendConferenceOffer } from "../../utils/socket-utils/socket-utils";
import { initJanus } from "../../actions/livestream-actions/livestreaming";
import Video from "./Video.jsx";
import { compose } from "redux";


export default class ConferenceCall extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            senderID: null,
            sender: "",
            firstName: "",
            lastName: "",
            receiver: [],
            roomID: null,
            remoteStreamList: {},
            onAudio: null,
            onVideo: null,
            numOfPublishers: 0
        }

        this.socket = null;
        this.ringTone = new Audio(ringing_tone);
        this.localStream = null;
        this.localStreamSrc = React.createRef();
        this.remoteStreamSrc = React.createRef();
        this.offerSDP = null;
        this.socketOrigin = null;
        this.sfu = null;
        this.janus = null;
    }

    componentDidMount() {
        let sender = window.sender;
        let receiver = window.receiver;

        if (sender !== "" && receiver !== "") {
            this.setState({ sender: sender, receiver: receiver });
            this.conferencePrepare();

            // this.socket = io("http://localhost:9000");
            this.socket = io("https://www.e-lab.live:9000");
            this.socket.on("connect", () => {
                console.log("open connection");
                sendAddOnlineUserEvent(this.socket, window.sender);
                initJanus().then(data => {
                    this.sfu = data.sfu;
                    this.janus = data.janus;
                    

                    if (window.userType === "caller") {
                        playRingTone(this.ringTone);
                        let roomIDToGenerate = Math.floor(Math.random() * 2468);
                        this.getRoomList();

                        this.generateRoom(data.sfu, roomIDToGenerate)
                            .then((roomID) => {
                                this.setState({ roomID: roomID });
                                sendConferenceOffer(this.socket, window.sender, window.receiver, roomID);
                                this.handleJoinAndConfigRoom(roomID);
                            });
                    } else if (window.userType === "callee") {
                        this.setState({ roomID: window.offerMessage.room });
                        this.handleJoinAndConfigRoom(window.offerMessage.room);
                    }

                    this.sfu.onmessage = (message, jsep) => {
                        Janus.log("::: Got a message ::: ", message);
                        let event = message.videoroom;
                        Janus.log(("Event: " + event));
                        if (event !== undefined && event !== null) {
                            if (event === "joined") {
                                this.setState({ onAudio: true, onVideo: true });
                                Janus.log("Successfully joined room " + message.room + " with ID " + message.id);
                                window.addEventListener("beforeunload", () => this.leaveConferenceCall());
                                if (message.publishers !== undefined && message.publishers !== null) {
                                    console.log("GOT NEW LIST OF PUBLISHERS: ", message.publishers);
                                    this.setState({ numOfPublishers: message.publishers.length });
                                    message.publishers.forEach(publisher => {
                                        console.log(publisher);
                                        this.handleNewPublisher(publisher);
                                    });
                                }

                            } else if (event === "event") {
                                if (message.publishers !== undefined && message.publishers !== null) {
                                    console.log("GOT NEW LIST OF PUBLISHERS IN EVENT: ", message.publishers);
                                    this.setState({ numOfPublishers: message.publishers.length });
                                    message.publishers.forEach(publisher => {
                                        this.handleNewPublisher(publisher);
                                    });
                                }
                            }
                        }

                        if (jsep !== undefined && jsep !== null) {
                            Janus.log("Handling SDP as well...");
                            Janus.log(jsep);
                            this.sfu.handleRemoteJsep({ jsep: jsep });
                        }
                    }

                    this.sfu.onlocalstream = (stream) => {
                        Janus.log(" ::: Got a local stream ::: ", stream);
                        this.localStreamSrc.current.srcObject = stream;
                        this.liveStream = stream;
                        stopRingTone(this.ringTone);
                    }

                    this.sfu.onremotestream = (stream) => {
                        Janus.log(" ::: Got a remote stream ::: ", stream);
                    }

                    this.sfu.oncleanup = () => {

                    }
                });


                this.socket.on("conference", (message) => {
                    console.log("conference message: ", message);

                    switch (message.type) {
                        case "conference-answer":
                            break;

                        case "conference-decline":
                            console.log("DECLINE", message);
                            break;

                        case "conference-leave":
                            break;

                        case "conference-hangup":
                            break;

                        case "conference-picked-up":
                            break;

                        default:
                            break;

                    }
                });

            });
        }
    }

    conferencePrepare = () => {
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null) {
            if (user.id !== undefined && user.id !== null) {
                this.setState({ senderID: Math.floor(Math.random() * 2468) });
            }

            if (user.firstName !== undefined && user.firstName !== null) {
                this.setState({ firstName: user.firstName });
            }

            if (user.lastName !== undefined && user.lastName !== null) {
                this.setState({ lastName: user.lastName });
            }
        }
    }

    getRoomList = () => {
        let body = { request: "list" }
        this.sfu.send({
            message: body, success: (message) => {
                console.log("ROOM", message);
            }
        });
    }


    generateRoom = (sfu, roomID) => {
        return new Promise((resolve, reject) => {
            let roomConfig = {
                request: "create",
                room: roomID,
                permanent: false,
                description: `Conference Room - ${roomID}`,
                publishers: 6
            };
            sfu.send({
                message: roomConfig,
                success: (message) => {
                    console.log("=== room created === ", message);
                    resolve(message.room);
                },
                error: (error) => {
                    console.log(error);
                    let anotherRoomID = Math.floor(Math.random() * 3579);
                    this.setState({ roomID: anotherRoomID });
                    this.generateRoom(sfu, anotherRoomID);
                    reject(error);
                }
            });
        });
    }

    handleJoinAndConfigRoom = (roomID) => {
        if (this.sfu !== undefined && this.sfu !== null) {
            this.sfu.createOffer({
                media: { video: "hires-16:9", audioRecv: false, videoRecv: false, audioSend: true, videoSend: true },
                success: (jsep) => {
                    let publisherConfig = {
                        request: "joinandconfigure",
                        ptype: "publisher",
                        room: roomID,
                        id: this.state.senderID,
                        display: `${this.state.firstName} ${this.state.lastName}`,
                        audio: true,
                        video: true
                    };

                    this.sfu.send({ message: publisherConfig, jsep: jsep });
                },
                error: (error) => {
                    Janus.error("WebRTC error: ", error);
                    console.log("WebRTC error... " + JSON.stringify(error));

                }
            })
        }
    }

    handleNewPublisher = (publisher) => {
        console.log("handle new publisher: ", publisher.id, " with room ", this.state.roomID);
        let remoteFeed = null;
        if (this.janus !== undefined && this.janus !== null) {
            this.janus.attach({
                plugin: "janus.plugin.videoroom",
                success: (pluginHandle) => {
                    remoteFeed = pluginHandle;
                    let subscriberConfig = {
                        request: "join",
                        ptype: "subscriber",
                        room: this.state.roomID,
                        feed: publisher.id
                    };

                    // if (Janus.webRTCAdapter.browserDetails.browser === 'safari'
                    //     && (publisher.video_codec === 'vp9' || (publisher.video_codec === 'vp8' && !Janus.safariVp8))) {
                    //     if (publisher.video_codec) { publisher.video_codec = publisher.video_codec.toUpperCase(); }
                    //     subscriberConfig["offer_video"] = false;
                    // }

                    remoteFeed.videoCodec = publisher.video_codec;
                    remoteFeed.send({ message: subscriberConfig });
                },
                error: function (error) {
                    Janus.log("  -- Error attaching plugin...", error);

                },
                onmessage: (message, jsep) => {
                    Janus.log(" ::: Got a message (subscriber) ::: ", message);
                    let event = message.videoroom;
                    if (message.error !== undefined && message.error !== null) {
                        console.log("Error occurs: ", message.error);
                    } else if (event !== undefined && event !== null) {
                        if (event === "attached") {
                            // Subscriber created and attached
                            Janus.log(`[VideoRoom][Remote] Successfully attached to feed ${remoteFeed.getPlugin()} (${remoteFeed.getId()}) in room ${message.room}`);
                        }
                    }

                    if (jsep !== undefined && jsep !== null) {
                        Janus.log('[VideoRoom][Remote] Handling SDP as well...');
                        Janus.log(jsep);
                        // Answer and attach
                        remoteFeed.createAnswer(
                            {
                                jsep,
                                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                                success: (jsep) => {
                                    Janus.debug('[VideoRoom][Remote] Got SDP!');
                                    Janus.debug(`[VideoRoom][Remote] ${jsep}`);
                                    const body = { request: "start", room: this.state.roomID };
                                    remoteFeed.send({ message: body, jsep });
                                },
                                error: (error) => {
                                    Janus.error('[VideoRoom][Remote] WebRTC error:', error);
                                },
                            }
                        );
                    }
                },
                onremotestream: (stream) => {
                    Janus.log(`[VideoRoom][Remote] Remote stream`);
                    let remoteStreamList = this.state.remoteStreamList;
                    remoteStreamList[publisher.id] = stream;
                    this.setState({ remoteStreamList });
                },
                oncleanup: () => {
                    Janus.log(`[VideoRoom][Remote] ::: Got a cleanup notification (remote feed ${publisher.id}) :::`);
                },
            });
        } else {
            console.log("Cannot find Janus instance");
        }
    }

    handleAudioState = (e) => {
        e.preventDefault();
        if (this.sfu !== undefined && this.sfu !== null) {
            if (this.sfu.isAudioMuted()) {
                console.log("AUDIO IS MUTED");
                this.sfu.unmuteAudio();
                this.setState({ onAudio: true });
            } else {
                console.log("AUDIO IS WORKING");
                this.sfu.muteAudio();
                this.setState({ onAudio: false });
            }
        }
    }

    handleVideoState = (e) => {
        e.preventDefault();
        if (this.sfu !== undefined && this.sfu !== null) {
            if (this.sfu.isVideoMuted()) {
                this.sfu.unmuteVideo();
                this.setState({ onVideo: true });
            } else {
                this.sfu.muteVideo();
                this.setState({ onVideo: false });
            }
        }
    }

    handleHangup = (e) => {
        e.preventDefault();
        this.leaveConferenceCall();
        this.destroyRoom();
    }

    leaveConferenceCall = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let leavingRoomConfig = { request: "leave" };
            this.sfu.send({ message: leavingRoomConfig });
            this.destroyRoom();
        }
    }

    destroyRoom = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "destroy", room: this.state.roomID };
            this.sfu.send({
                message: body, success: (message) => {
                    console.log(message);
                }
            });
        }
    }

    componentWillUnmount = () => {
        this.leaveConferenceCall();
        this.destroyRoom();
    }

    render() {
        console.log(this.state.numOfPublishers, " number of parti")
        return (
            <React.Fragment >
                <div className="conference-screen-page">
                    <div className="conference-screen-container">
                        <div className="row">
                            <div className="col-12 col-md-12 col-lg-12 col-xl-12">
                                <div className="conference-remotestream-container">
                                    {this.state.remoteStreamList && Object.keys(this.state.remoteStreamList).map((key, index) =>
                                        <div className={`conference-remote-stream-${this.state.numOfPublishers}`}>
                                            <Video key={index} srcObject={this.state.remoteStreamList[key]} autoPlay />
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12 col-md-12 col-lg-12 col-xl-12 conference-localstream-container">
                                <video className="conference-local-stream" ref={this.localStreamSrc} muted autoPlay>

                                </video>
                                <div className="call-buttons">
                                    {this.sfu === undefined || this.sfu === null ? null :
                                        <button type="button" className="btn-call ml-5" onClick={this.handleAudioState}>
                                            {this.state.onAudio ? <i className="fas fa-microphone"></i> : <i className="fas fa-microphone-slash"></i> }
                                        </button>
                                    }

                                    <button type="button" className="btn-hangup ml-5" onClick={this.handleHangup}>
                                        <i className="fas fa-phone-slash"></i>
                                    </button>
                                    
                                    {(this.sfu === undefined || this.sfu === null) ? null :
                                        <button type="button" className="btn-call ml-5" onClick={this.handleVideoState}>
                                            {this.state.onVideo ? <i className="fas fa-video"></i> : <i className="fas fa-video-slash"></i>}
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </React.Fragment >
        )
    }
}
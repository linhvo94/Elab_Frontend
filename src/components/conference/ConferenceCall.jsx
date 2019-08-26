import React from "react";
import io from "socket.io-client";
import Janus from "../../utils/janus-utils/janus.js";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { sendAddOnlineUserEvent, sendConferenceOffer, sendConferenceHangupEvent, sendConferenceAnswer, sendConferenceLeavingEvent } from "../../utils/socket-utils/socket-utils";
import { initJanus } from "../../actions/livestream-actions/livestreaming";
import Video from "./Video.jsx";


export default class ConferenceCall extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            senderID: null,
            sender: "",
            firstName: "",
            lastName: "",
            receiver: {},
            roomID: null,
            remoteStreamList: {},
            notifications: [],
            onAudio: null,
            onVideo: null,
            pickedUp: null
        }

        this.socket = null;
        this.ringTone = new Audio(ringing_tone);
        this.localStreamSrc = React.createRef();
        this.socketOrigin = null;
        this.sfu = null;
        this.janus = null;
        this.remoteFeeds = [];
        this.messagesEndRef = React.createRef();
        this.videos = ["http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"]
    }

    componentDidMount() {
        let sender = window.sender;
        let receiver = window.receiver;

        if (sender !== "" && receiver !== "") {
            this.setState({ sender: sender, receiver: receiver });
            this.conferencePrepare();

            this.socket = io("https://www.e-lab.live:9000");
            this.socket.on("connect", () => {
                console.log("open connection");
                sendAddOnlineUserEvent(this.socket, window.sender);

                if (window.userType === "callee") {
                    this.socketOrigin = window.offerMessage.socketOrigin;
                    sendConferenceAnswer(this.socket, sender, window.offerMessage.sender, window.offerMessage.socketOrigin);
                }

                initJanus().then(data => {
                    this.sfu = data.sfu;
                    this.janus = data.janus;
                    if (window.userType === "caller") {
                        playRingTone(this.ringTone);
                        let roomIDToGenerate = Math.floor(Math.random() * 2468);
                        this.generateRoom(data.sfu, roomIDToGenerate)
                            .then((roomID) => {
                                window.addEventListener("beforeunload", this.handleStopConference);
                                this.setState({ roomID: roomID });
                                sendConferenceOffer(this.socket, window.sender, Object.keys(window.receiver), roomID);
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
                                Janus.log("Successfully joined room " + message.room + " with ID " + message.id);
                                this.setState({ onAudio: true, onVideo: true });
                                window.addEventListener("beforeunload", this.leaveConferenceCall);

                                if (message.publishers !== undefined && message.publishers !== null) {
                                    console.log("GOT NEW LIST OF PUBLISHERS: ", message.publishers);
                                    message.publishers.forEach(publisher => {
                                        this.pushNotifications(publisher.id, "joined");
                                        this.handleNewPublisher(publisher);
                                    });
                                }

                            } else if (event === "event") {
                                if (message.publishers !== undefined && message.publishers !== null) {
                                    console.log("GOT NEW LIST OF PUBLISHERS IN EVENT: ", message.publishers);
                                    message.publishers.forEach(publisher => {
                                        this.pushNotifications(publisher.id, "joined");
                                        this.handleNewPublisher(publisher);
                                    });
                                } else if (message.leaving !== undefined && message.leaving !== null) {
                                    if (message.leaving === "ok") {
                                        if (Object.keys(this.state.remoteStreamList).length === 0) {
                                            this.destroyRoom();
                                        }

                                        this.setState({ remoteStreamList: {}, notifications: [] });
                                        this.remoteFeeds.forEach(remoteFeed => remoteFeed.detach());
                                        this.sfu.detach();
                                        sendConferenceLeavingEvent(this.socket, this.state.sender);
                                        window.close();
                                        // setTimeout(() => {
                                        //     window.close();
                                        // }, 2000);

                                    } else {
                                        console.log(`publisher id ${message.leaving} is left`);
                                        this.pushNotifications(message.leaving, "leaving");
                                        let { remoteStreamList } = this.state;
                                        delete remoteStreamList[message.leaving];
                                        this.setState({ remoteStreamList });
                                        let remoteFeed = this.remoteFeeds[message.leaving];
                                        remoteFeed.detach();
                                        delete this.remoteFeeds[message.leaving];


                                        console.log("CURRENT REMOTE LIST, ", this.state.remoteStreamList)
                                        if (Object.keys(this.state.remoteStreamList).length === 0) {
                                            this.leaveConferenceCall();

                                        }
                                        console.log("ONE HAS DROPPRED ", this.state.remoteStreamList);
                                    }
                                } else if (message.unpublished !== undefined && message.unpublished !== null) {
                                    if (message.unpublished === "ok") {
                                        if (Object.keys(this.state.remoteStreamList).length === 0) {
                                            this.destroyRoom();
                                        }

                                        this.setState({ remoteStreamList: {}, notifications: [] });
                                        this.remoteFeeds.forEach(remoteFeed => remoteFeed.detach());
                                        this.sfu.detach();
                                        sendConferenceLeavingEvent(this.socket, this.state.sender);
                                        window.close();
                                        // setTimeout(() => {
                                        //     window.close();
                                        // }, 2000);

                                    } else {
                                        console.log(`publisher id ${message.unpublished} is left`);
                                        this.pushNotifications(message.unpublished, "leaving");
                                        let { remoteStreamList } = this.state;
                                        delete remoteStreamList[message.unpublished];
                                        this.setState({ remoteStreamList });
                                        let remoteFeed = this.remoteFeeds[message.unpublished];
                                        remoteFeed.detach();
                                        delete this.remoteFeeds[message.unpublished];

                                        console.log("CURRENT REMOTE LIST, ", this.state.remoteStreamList)
                                        if (Object.keys(this.state.remoteStreamList).length === 0) {
                                            sendConferenceLeavingEvent(this.socket, this.state.sender);
                                            this.leaveConferenceCall();
                                        }
                                    }
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
                    }

                    this.sfu.onremotestream = (stream) => {
                        Janus.log(" ::: Got a remote stream ::: ", stream);
                    }

                    this.sfu.oncleanup = () => {

                    }
                });


                this.socket.on("conference", (message) => {
                    console.log("conference message: ", message);
                    let { notifications } = this.state;

                    switch (message.type) {
                        case "conference-answer":
                            console.log("answered : ", message);
                            this.setState({ pickedUp: true });
                            stopRingTone(this.ringTone);
                            window.removeEventListener("beforeunload", this.handleStopConference);
                            break;

                        case "conference-decline":
                            console.log("DECLINE", message);
                            notifications.push(`${message.sender} has declined the conference.`);
                            this.setState({ notifications });
                            this.scrollToBottom();
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
                this.setState({ senderID: user.id });
            }

            if (user.firstName !== undefined && user.firstName !== null) {
                this.setState({ firstName: user.firstName });
            }

            if (user.lastName !== undefined && user.lastName !== null) {
                this.setState({ lastName: user.lastName });
            }
        }

    }

    pushNotifications = (publisherID, type) => {
        if (Object.values(this.state.receiver).length > 0) {
            let publisher = Object.values(this.state.receiver).find(receiverValue => receiverValue.id === publisherID);
            if (publisher !== undefined && publisher !== null) {
                let { notifications } = this.state;
                if (type === "joined") {
                    notifications.push(`${publisher.firstName} ${publisher.lastName} has joined the conference.`);
                } else if (type === "leaving") {
                    console.log("LEAVING NOTI");
                    notifications.push(`${publisher.firstName} ${publisher.lastName} has left the conference.`);
                }

                this.setState({ notifications });
                this.scrollToBottom();
            }
        }
    }

    // getRoomList = () => {
    //     let body = { request: "list" }
    //     this.sfu.send({
    //         message: body, success: (message) => {
    //             console.log("ROOM", message);
    //         }
    //     });
    // }


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
        } else {
            alert("Cannot find Janus instance");
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
                    this.remoteFeeds[publisher.id] = remoteFeed;

                    let subscriberConfig = {
                        request: "join",
                        ptype: "subscriber",
                        room: this.state.roomID,
                        feed: publisher.id
                    };

                    if (Janus.webRTCAdapter.browserDetails.browser === 'safari'
                        && (publisher.video_codec === 'vp9' || (publisher.video_codec === 'vp8' && !Janus.safariVp8))) {
                        if (publisher.video_codec) { publisher.video_codec = publisher.video_codec.toUpperCase(); }
                        subscriberConfig["offer_video"] = false;
                    }

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
                    let { remoteStreamList } = this.state;
                    remoteStreamList[publisher.id] = stream;
                    this.setState({ remoteStreamList });
                },
                oncleanup: () => {
                    Janus.log(`[VideoRoom][Remote] ::: Got a cleanup notification (remote feed ${publisher.id}) :::`);
                },
            });
        } else {
            alert("Cannot find Janus instance");
        }
    }

    handleAudioState = (e) => {
        e.preventDefault();
        if (this.sfu !== undefined && this.sfu !== null) {
            if (this.sfu.isAudioMuted()) {
                this.sfu.unmuteAudio();
                this.setState({ onAudio: true });
            } else {
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
    }

    leaveConferenceCall = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let leavingRoomConfig = { request: "leave" };
            this.sfu.send({ message: leavingRoomConfig });
        }
    }

    handleStopConference = (e) => {
        e.preventDefault();
        this.destroyRoom();
        sendConferenceHangupEvent(this.socket, this.state.sender, Object.keys(this.state.receiver));
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

    scrollToBottom = () => {
        this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    componentWillUnmount = () => {
        this.leaveConferenceCall();
    }

    render() {
        console.log("VALUES", this.remoteFeeds);
        return (
            <React.Fragment >
                <div className="conference-screen-page">
                    <div className="conference-screen-container">
                        <div className="row">
                            <div className="col-12 col-md-12 col-lg-12 col-xl-12 conference-remotestream-container">
                                {this.state.remoteStreamList && Object.keys(this.state.remoteStreamList).map((key, index) =>
                                    <div className={`conference-remote-stream-${Object.keys(this.state.remoteStreamList).length}`} key={index}>
                                        <Video key={index} srcObject={this.state.remoteStreamList[key]} autoPlay />
                                    </div>
                                )}

                                {/* {this.videos.map((v, index) =>

                                    <div key={index} className={`conference-remote-stream-${this.videos.length}`}>
                                        <Video key={index} srcObject={v} autoPlay />
                                    </div>

                                )} */}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12 col-md-12 col-lg-12 col-xl-12 conference-localstream-container">
                                <div className="conference-notifications">
                                    <ul>
                                        {this.state.notifications.map((notification, index) =>
                                            <li key={index} className="conference-message">
                                                {notification}
                                            </li>
                                        )}

                                        <div ref={this.messagesEndRef}></div>

                                    </ul>
                                </div>
                                <div className="conference-local-stream">
                                    <video ref={this.localStreamSrc} muted autoPlay>

                                    </video>
                                </div>
                                <div className="call-buttons">
                                    {this.sfu === undefined || this.sfu === null ? null :
                                        <button type="button" className="btn-call" onClick={this.handleAudioState}>
                                            {this.state.onAudio ? <i className="fas fa-microphone"></i> : <i className="fas fa-microphone-slash"></i>}
                                        </button>
                                    }

                                    <button type="button" className="btn-hangup" onClick={this.state.pickedUp === true || this.state.pickedUp === null ? this.handleHangup : this.handleStopConference}>
                                        <i className="fas fa-phone-slash"></i>
                                    </button>

                                    {(this.sfu === undefined || this.sfu === null) ? null :
                                        <button type="button" className="btn-call" onClick={this.handleVideoState}>
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
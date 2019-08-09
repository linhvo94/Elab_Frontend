import React from "react";
import Janus from "../../janus-utils/janus.js";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";

export default class LiveStreamDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomID: "",
            firstName: "",
            lastName: "",
            participantID: "",
            privateParticipantID: "",
            publisherID: "",
            isPublisher: false,
            isStreamPlaying: null,
            isPublishing: false,
            isOnLive: null,
            fullScreen: false,
            livestream: null,
            title: "",
            description: "",
            publisherName: "",
            url: "",
            error: "",
            loading: true
        }

        this.sfu = null;
        this.liveStreamSrc = React.createRef();
    }

    componentDidMount() {
        if (this.props.match.params.id !== undefined && this.props.match.params.id !== null && !isNaN(parseInt(this.props.match.params.id))) {
            console.log("HELLO, config janus");
            this.livestreamPrepare();
            this.props.getALiveStream(this.props.match.params.id);
            initJanus().then(sfu => {
                this.sfu = sfu;
                this.setState({ isOnLive: false, loading: false });
                this.getRoomList();
                if (!this.state.isPublisher) {
                    console.log("SUBCRIBING");
                    this.checkRoomExistence().then(message => {
                        this.subscribeStream(message.room, this.state.publisherID);
                        // console.log("SUBCRIBING");
                    });
                }
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.livestream !== undefined && this.props.livestream !== null) {
            if (this.props.livestream !== prevProps.livestream && !this.state.isPublishing) {
                console.log(this.props.livestream);
                this.setState({ publisherID: this.props.livestream.publisher.id });
                if (this.props.livestream.url === null) {
                    if (this.state.participantID === this.props.livestream.publisher.id) {
                        this.setState({ isPublisher: true });
                        console.log("is publisher true");
                    } else {
                        this.setState({ isPublisher: false });
                    }
                } else {

                }

                this.setState({
                    livestream: this.props.livestream,
                    title: this.props.livestream.title,
                    description: this.props.livestream.description,
                    publisherName: `${this.props.livestream.publisher.firstName} ${this.props.livestream.publisher.lastName}`,
                    url: this.props.livestream.url
                });
            }
        }
    }

    getRoomList = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "list" };
            this.sfu.send({
                message: body, success: (message) => {
                    console.log("ROOM", message);
                }
            });
        }
    }

    livestreamPrepare = () => {
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null) {
            if (user.id !== undefined && user.id !== null) {
                this.setState({ participantID: user.id });
            }

            if (user.firstName !== undefined && user.firstName !== null) {
                this.setState({ firstName: user.firstName });
            }

            if (user.lastName !== undefined && user.lastName !== null) {
                this.setState({ lastName: user.lastName });
            }
        }
    }

    publishStream = () => {
        this.checkRoomExistence().then(message => {
            this.setState({ roomID: message.room });
            this.configStream();
        });

        this.sfu.onmessage = (message, jsep) => {
            Janus.log("::: Got a message :::");
            Janus.log("OUTSIDE MESSAGE: ", message);
            let event = message.videoroom;
            Janus.log(("Event: " + event));
            if (event !== undefined && event !== null) {
                if (event === "joined") {
                    this.setState({ privateParticipantID: message.private_id, isOnLive: true });
                    console.log("MESSAGE", message);
                    Janus.log("Successfully joined room " + message.room + " with ID " + message.id);
                    window.addEventListener("beforeunload", () => this.leaveLiveStreamRoom());

                } else if (event === "event") {

                }
            }

            if (jsep !== undefined && jsep !== null) {
                Janus.log("Handling SDP as well...");
                Janus.debug(jsep);
                this.sfu.handleRemoteJsep({ jsep: jsep });
            }
        }

        this.sfu.onlocalstream = (stream) => {
            Janus.log(" ::: Got a local stream ::: ", stream);
            this.liveStreamSrc.current.srcObject = stream;
        }
    }

    checkRoomExistence = () => {
        return new Promise((resolve, reject) => {
            let body = { request: "exists", room: parseInt(this.props.match.params.id) };
            this.sfu.send({
                message: body, success: (message) => {
                    console.log("EXIST: ", message);
                    if (message.exists) {
                        resolve(message);
                    } else {
                        this.setState({ error: "Livestream is unavailable" });
                        // reject(message);
                    }
                }
            });
        });
    }

    configStream = () => {
        this.sfu.createOffer({
            media: { audioRecv: false, videoRecv: false, audioSend: true, videoSend: true },
            success: (jsep) => {
                Janus.log("Got publisher SDP!");

                let publisherConfig = {
                    request: "joinandconfigure",
                    ptype: "publisher",
                    room: this.state.roomID,
                    id: this.state.participantID,
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
        });
    }

    pauseStream = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "pause" }
            this.sfu.send({ message: body });
        }
    }

    resumeStream = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "start" };
            this.sfu.send({ message: body });
        }
    }

    leaveLiveStreamRoom = () => {
        let unpublishConfig = { request: "leave" };
        this.sfu.send({ message: unpublishConfig });
    }

    subscribeStream = (roomID, publisherID) => {
        console.log("INFO", roomID, publisherID);
        let subscriberConfig = {
            request: "join",
            ptype: "subscriber",
            room: roomID,
            feed: publisherID
        };

        this.sfu.videoCodec = "vp8".toUpperCase();
        this.sfu.send({ message: subscriberConfig });

        this.sfu.onmessage = (message, jsep) => {
            console.log(message);
            let event = message.videoroom;
            // console.log(event);

            if (event !== undefined && event !== null) {
                if (event === "attached") {
                    window.addEventListener("beforeunload", () => this.leaveLiveStreamRoom());
                } else if (event === "event") {
                    if (message.started !== undefined && message.started !== null) {
                        if (message.started === "ok") {
                            console.log("START SUCCESS");
                            this.setState({ isStreamPlaying: true });
                        }
                    } else if (message.paused !== undefined && message.paused !== null) {
                        if (message.paused === "ok") {
                            console.log("PAUSED SUCCESS");
                            this.setState({ isStreamPlaying: false });
                        }
                    }
                } 
            }

            if (jsep !== undefined && jsep !== null) {
                Janus.log("Handling SDP as well...");
                this.sfu.createAnswer({
                    jsep: jsep,
                    media: { audioSend: false, videoSend: false },
                    success: (jsep) => {
                        let body = { request: "start", room: roomID };
                        this.sfu.send({ message: body, jsep: jsep });
                    },
                    error: (error) => {
                        Janus.log("Error: ", error);
                    }
                });
            }
        }
        
        this.sfu.onremotestream = (stream) => {
            Janus.log(" ::: Got a remote stream ::: ", stream);
            this.liveStreamSrc.current.srcObject = stream;       
        }

        this.sfu.error = (error) => {
            console.log(error)
        }
    }

    openFullScreen = () => {
        this.setState({ fullScreen: true });
        let videoContainer = document.getElementById("video-container");
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
            videoContainer.mozRequestFullScreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
        }
    }

    exitFullScreen = () => {
        this.setState({ fullScreen: false });

        if (document.exitFullScreen) {
            document.exitFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    componentWillUnmount() {
        this.leaveLiveStreamRoom();
    }

    render() {
        console.log(this.state.isOnLive, this.state.privateParticipantID);
        return (
            <React.Fragment>
                {this.state.loading ? <div className="loader"></div> :
                    <React.Fragment>
                        <div className="col-7 livestreamdetail-container">
                            <div className="livestreamdetail-header">
                                <label>{this.state.title}</label>
                                {this.state.isOnLive === null || !this.state.isPublisher ? null :
                                    this.state.isOnLive ? <button onClick={this.leaveLiveStreamRoom}>Stop Publishing</button>
                                        :
                                        <button onClick={this.publishStream}>Start Publishing</button>
                                }
                            </div>
                            <div className="livestreamdetail-videocontainer">
                                <div className="video-container" id="video-container">
                                    <video className="livestream-video" id="livestream-video" ref={this.liveStreamSrc} autoPlay muted></video>
                                    <div className="controls">
                                        <div className="video-progress-bar">
                                            <div className="video-progress-bar-color">

                                            </div>
                                        </div>

                                        <div className="video-buttons">
                                            {this.state.isPublisher ? null :
                                                this.state.isStreamPlaying === null ? null :

                                                    this.state.isStreamPlaying ?
                                                        <button type="button" id="play-button" onClick={this.pauseStream}>
                                                            <i className="fas fa-pause"></i>
                                                        </button>
                                                        : <button type="button" id="play-button" onClick={this.resumeStream}>
                                                            <i className="fas fa-play"></i>
                                                        </button>}

                                            {this.state.fullScreen ?
                                                <button type="button" id="screen-adjust-button" onClick={this.exitFullScreen}>
                                                    <i className="fas fa-compress"></i>
                                                </button>
                                                :
                                                <button type="button" id="screen-adjust-button" onClick={this.openFullScreen}>
                                                    <i className="fas fa-expand"></i>
                                                </button>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="livestreamdetail-description">
                                <label>Lecturer: {this.state.publisherName} </label>
                                <p>{this.state.description}</p>
                            </div>
                        </div>

                        <div className="col-4 livestreamdetail-chat-container">
                            <div className="livestreamdetail-chat-header">
                                <label>Live Chat</label>
                            </div>

                            <div className="livestreamdetail-chat">
                                <ul>

                                </ul>
                            </div>

                            <div className="livestreamdetail-message">
                                <textarea className="message-to-send" id="message-to-send" placeholder="Type your message" rows="1"></textarea>
                                <button>Send</button>

                            </div>
                        </div>
                    </React.Fragment>
                }

            </React.Fragment >
        )
    }

}
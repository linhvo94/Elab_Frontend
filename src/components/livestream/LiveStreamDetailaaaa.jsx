import React from "react";
import Janus from "../../janus-utils/janus.js";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";

export default class LiveStreamDetailaaa extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomID: "",
            firstName: "",
            lastName: "",
            participantID: "",
            privateParticipantID: "",
            isStreamPlaying: null,
            fullScreen: false,
            error: ""
        }
        this.sfu = null;
        this.liveStreamSrc = React.createRef();
    }


    componentDidMount() {
        if (this.props.match.params.id === undefined || this.props.match.params.id === null || isNaN(parseInt(this.props.match.params.id))) {
            alert("Invalid room id");
        } else {
            initJanus().then(sfu => {
                this.sfu = sfu;
                let body = { request: "exists", room: parseInt(this.props.match.params.id) };
                this.sfu.send({
                    message: body, success: (message) => {
                        console.log("EXIST: ", message);
                        if (message.exists) {
                            this.setState({ roomID: message.room });
                            this.livestreamPrepare();
                            // if (!this.state.isLecturer) {
                            //     this.subscribeStream(message.room);
                            // }
                        } else {
                            this.setState({ error: "Livestream is unavailable" });
                        }
                    }
                });
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
        this.configStream();

        this.sfu.onmessage = (message, jsep) => {
            Janus.log("::: Got a message :::");
            Janus.log("MESSAGE: ", message);
            let event = message.room;
            Janus.log(("Event: " + event));
            if (event !== undefined && event !== null) {
                if (event === "joined") {
                    console.log("MESSAGE", message);
                    this.setState({ privateParticipantID: message.private_id });
                    Janus.log("Successfully joined room " + message.room + " with ID " + message.id);

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

    subscribeStream = (roomID) => {
        let subscriberConfig = {
            request: "join",
            ptype: "subscriber",
            room: roomID,
            feed: 2
        };

        this.sfu.videoCodec = "vp8".toUpperCase();
        this.sfu.send({ message: subscriberConfig });

        this.sfu.onmessage = (message, jsep) => {
            console.log(message);
            let event = message.videoroom;
            console.log(event);

            if (event !== undefined && event !== null) {
                if (event === "event") {
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
                        let body = { request: "start", room: 456 };
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
            this.liveStreamSrc.current.srcObject = null;
            this.liveStreamSrc.current.srcObject = stream;
            this.setState({ isStreamPlaying: true });
        }

        this.sfu.error = (error) => {
            console.log(error)
        }
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

    render() {
        return (
            <div className="livestream-detail-page">
                <div className="row h-100">
                    <div className="col-12 col-sm-12 col-md-8 col-lg-8">
                        <div className="livestream-detail-container">
                            <div className="video-container" id="video-container">
                                {this.state.isLecturer ? <video className="livestream-video" id="livestream-video" ref={this.liveStreamSrc} autoPlay muted></video>
                                    :
                                    <video className="livestream-video" id="livestream-video" ref={this.liveStreamSrc} autoPlay muted></video>
                                }

                                <div className="controls">
                                    <div className="video-progress-bar">
                                        <div className="video-progress-bar-color">

                                        </div>
                                    </div>

                                    <div className="video-buttons">
                                        {this.state.isLecturer ?
                                            <button type="button" id="play-button" onClick={this.publishStream}>
                                                <i className="fas fa-play"></i>
                                            </button>
                                            :
                                            this.state.isStreamPlaying === null ?
                                                <button type="button" id="play-button">
                                                    <i className="fas fa-play"></i>
                                                </button>
                                                : this.state.isStreamPlaying ?
                                                    <button type="button" id="play-button"
                                                        onClick={this.pauseStream}>
                                                        <i className="fas fa-pause"></i>
                                                    </button>

                                                    : <button type="button" id="play-button"
                                                        onClick={this.resumeStream}>
                                                        <i className="fas fa-play"></i>
                                                    </button>
                                        }

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
                        <div className="livestream-description-container">
                            <h1>This is a live stream</h1>

                            {this.state.isLecturer ?
                                <button type="button" className="btn btn-default publish-stream-button" onClick={this.publishStream}>
                                    Start Publishing
                                </button> : null
                            }
                        </div>
                    </div>

                    <div className="col-0 col-sm-0 col-md-4 col-lg-4">
                        <div className="livestream-chatwindow-container">

                        </div>
                    </div>

                </div>
            </div>
            // <div className="livestream-detail-page">
            // <div className="row livestream-detail-container">
            //     <div className="video-container">
            //         <video className="livestream-video" ref={this.liveStreamSrc} autoPlay muted>

            //         </video>

            //         <div className="controls">
            //             <div className="video-progress-bar">
            //                 <div className="video-progress-bar-color">

            //                 </div>
            //             </div>

            //             <div className="video-buttons">
            //                 <button type="button" id="play-button" onClick={this.publishStream}>
            //                     <i className="fas fa-play"></i>
            //                 </button>
            //             </div>
            //         </div>
            //     </div>
            //     <button className="btn btn-success" onClick={this.subscribeStream}>Subscribe</button>
            //     {/* <button className="btn btn-success" onClick={this.publishStream}>Start</button>
            //     <button className="btn btn-success" onClick={this.subscribeStream}>Subscribe</button> */}
            // </div>
            // // </div>
        )
    }
}
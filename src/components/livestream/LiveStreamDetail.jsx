import React from "react";
import Janus from "../../janus-utils/janus.js";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";
import { thisExpression } from "@babel/types";

export default class LiveStreamDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomID: "",
            firstName: "",
            lastName: "",
            participantID: "",
            privateParticipantID: ""
        }
        this.sfu = null;
        this.liveStreamSrc = React.createRef();
    }

    componentDidMount() {
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

        if (this.props.match.params.id !== undefined && !isNaN(parseInt(this.props.match.params.id))) {
            this.setState({ roomID: parseInt(this.props.match.params.id) });
        }
    }

    publishStream = () => {
        initJanus().then(sfu => {
            this.sfu = sfu;

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
                    // id: 122,
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

    subscribeStream = () => {
        initJanus().then(sfu => {
            this.sfu = sfu;
            let subscriberConfig = {
                request: "join",
                ptype: "subscriber",
                room: this.state.roomID,
                feed: 1
            };

            this.sfu.videoCodec = "vp8".toUpperCase();
            this.sfu.send({ message: subscriberConfig });

            this.sfu.onmessage = (message, jsep) => {
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
                this.liveStreamSrc.current.srcObject = stream;
            }
        });

    }

    render() {
        return (
            // <div className="livestream-detail-page">
            <div className="row livestream-detail-container">
                <div className="video-container">
                    <video className="livestream-video" ref={this.liveStreamSrc} autoPlay muted>

                    </video>

                    <div className="controls">
                        <div className="video-progress-bar">
                            <div className="video-progress-bar-color">

                            </div>
                        </div>

                        <div className="video-buttons">
                            <button type="button" id="play-button">
                                <i className="fas fa-play"></i>
                            </button>
                        </div>
                    </div>
                </div>
                {/* <button className="btn btn-success" onClick={this.publishStream}>Start</button>
                <button className="btn btn-success" onClick={this.subscribeStream}>Subscribe</button> */}
            </div>
            // </div>
        )
    }
}
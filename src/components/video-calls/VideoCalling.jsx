import React from "./node_modules/react";
import "./node_modules/webrtc-adapter";
import uuid from "./node_modules/uuid";
import { SIGNALING_SERVER_URL } from "../../api-urls/signaling-api.js";
import { iceServerConfig } from '../../servers-config/ice-server-config.js';


class VideoCalling extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            localStream: "",
            remoteStream: "",
            pc: "",
            pc1: "",
            username: "",
            targetUsername: "",
            userId: uuid.v4(),
            users: []
        }
        this.wss = null;
        this.targetname = "";
        this.localStreamSource = React.createRef();
        this.remoteStreamSource = React.createRef();

    }

    componentDidMount() {
        this.wss = new WebSocket(SIGNALING_SERVER_URL);
        this.wss.onopen = () => {
            console.log('Client is open to Server');
        };

        this.wss.onmessage = (message) => {
            console.log(message.data);
            var msg = JSON.parse(message.data);
            switch (msg.type) {
                case "video-offer":  // Invitation and offer to chat
                    this.handleRemoteOffer(msg);
                    break;

                case "video-answer":  // Callee has answered our offer
                    this.handleVideoAnswerMsg(msg);
                    break;

                case "new-ice-candidate":
                    this.handleNewICECandidateMsg(msg);
                    break;

                default:
                    console.log("error");
            }
        }
    }


    handleChange = (e) => {
        this.setState({[e.target.name]: e.target.value});
    }

    hasUserMedia = () => {
        return !!(navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia);
    }

    openCamera = () => {
        if (this.hasUserMedia()) {
            var mediaConstraint = { video: true, audio: false };
            navigator.mediaDevices.getUserMedia(mediaConstraint)
                .then((stream) => {
                    this.localStreamSource.current.srcObject = stream;
                    this.setState({ localStream: stream });
                })
                .catch((e) => {
                    console.log(e);
                })
        } else {
            alert('Your browser does not support WebRTC. Please try to use other browser.');
        }

    }


    handleCall = () => {

        let { localStream } = this.state;


        let pc = new RTCPeerConnection(JSON.stringify(iceServerConfig));
        // let pc1 = new RTCPeerConnection(servers);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(event.candidate);

                this.wss.send(JSON.stringify({
                    type: "new-ice-candidate",
                    target: this.state.targetUsername,
                    candidate: event.candidate
                }))

                // pc1.addIceCandidate(event.candidate)
                //     .then(() => console.log("pc1 add ice candiate success"))
                //     .catch((error) => {
                //         console.log(error);
                //     });
            }
        }

        // pc1.onicecandidate = (event) => {
        //     if (event.candidate) {
        //         pc.addIceCandidate(event.candidate)
        //             .then(() => console.log("pc add ice candiate success"))
        //             .catch((error) => {
        //                 console.log(error);
        //             });
        //     }
        // }

        // pc1.ontrack = (event) => {
        //     if (this.remoteStreamSource.current.srcObject) return;
        //     this.remoteStreamSource.current.srcObject = event.streams[0];
        // }

        localStream.getTracks().forEach((track) =>
            pc.addTrack(track, localStream));

        pc.createOffer()
            .then(this.onCreateOfferSuccess)
            .catch(error => {
                console.log(error);
            });

        // this.setState({ localStream: localStream, pc: pc, pc1: pc1 });
        this.setState({ localStream: localStream, pc: pc });
    }

    handleNegotiationNeededEvent = () => {

    }

    onCreateOfferSuccess = (offerSDP) => {
        let { pc, pc1 } = this.state;
        pc.setLocalDescription(offerSDP)
            .then(() => {
                console.log("pc setLocalDescription successfully");
                console.log("offer SDP ", offerSDP);
                this.wss.send(JSON.stringify({
                    username: this.state.username,
                    target: this.state.targetUsername,
                    type: "video-offer",
                    sdp: offerSDP
                }))
            }, error => console.log(error));

        // pc1.setRemoteDescription(offerSDP)
        //     .then(() => {
        //         console.log("pc1 setRemoteDescription successfully");
        //         pc1.createAnswer()
        //             .then(this.onCreateAnswerSuccess, error => console.log(error))
        //     })
        //     .catch(error => {
        //         console.log(error);
        //     });

    }

    onCreateAnswerSuccess = (answerSDP) => {
        let { pc, pc1 } = this.state;

        // pc1.setLocalDescription(answerSDP)
        //     .then(() => console.log("pc1 setLocalDescription successfully"), error => console.log(error));

        pc.setRemoteDescription(answerSDP)
            .then(() => {
                console.log("pc setRemoteDescription successfully");

            })
            .catch(error => {
                console.log(error);
            })
    }

    handleRemoteOffer = (message) => {
        var localStream = null;
        let remoteSDP = new RTCSessionDescription(message.sdp);
        this.state.pc.setRemoteDescription(remoteSDP)
            .then(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }))
            .then((stream) => {
                this.remoteStreamSource.current.srcObject = stream;
                localStream = stream;
                localStream.getTracks().forEach((track) => this.state.pc.addTrack(track));
            })
            .then(() => this.state.pc.createAnswer())
            .then((answerSDP) => this.state.pc.setLocalDescription(answerSDP))
            .then(() => {
                this.wss.send(
                    JSON.stringify({
                        username: this.state.username,
                        target: message.username,
                        video: "video-answer",
                        sdp: this.state.pc.localDescription
                    })
                )
            })
    }

    handleVideoAnswerMsg(msg) {
        console.log("Call recipient has accepted our call");

        // Configure the remote description, which is the SDP payload
        // in our "video-answer" message.

        var desc = new RTCSessionDescription(msg.sdp);
        this.state.setRemoteDescription(desc).catch(e => console.log(e));
    }

    handleNewICECandidateMsg(msg) {
        var candidate = new RTCIceCandidate(msg.candidate);

        console.log("Adding received ICE candidate: " + JSON.stringify(candidate));
        this.state.pc.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }



    render() {
        return (
            <React.Fragment>
                <video ref={this.localStreamSource} autoPlay style={{
                    width: "240px",
                    height: "180px"
                }} />
                <video ref={this.remoteStreamSource} autoPlay style={{
                    width: "240px",
                    height: "180px"
                }} />

                <label >Your username</label>
                <input type="text" name="username" value={this.state.username} onChange={this.handleChange}/>

                <label>Your friend's username</label>
                <input type="text" name="targetUsername" value={this.state.targetUsername} onChange={this.handleChange}/>

                <button className="btn btn-success" onClick={this.openCamera}>Start</button>
                <button className="btn btn-info" onClick={this.handleCall}>Call</button>

            </React.Fragment>
        )
    }
}

export default VideoCalling;
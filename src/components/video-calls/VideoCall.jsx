import React from "react";
import io from "socket.io-client";
import { SIGNALING_SERVER_URL } from "../../api-urls/signaling-api.js";
import { iceServerConfig} from '../../servers-config/ice-server-config.js';


class VideoCall extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            localStream: "",
            peerConnection: "",
            username: "",
            targetUsername: "",
        }

        this.socket = null;
        this.localStreamSource = React.createRef();
        this.remoteStreamSource = React.createRef();
    }

    componentDidMount() {
        console.log(iceServerConfig, "peer connection")

        this.socket = io(SIGNALING_SERVER_URL);

        this.socket.on("connect", () => {
            console.log("Connection is open");

            this.socket.emit("join", "gaming");

            this.socket.on("videocall", (message) => {
                console.log("message from video call", JSON.parse(message).type);
                let receivedMessage = JSON.parse(message)

                switch (receivedMessage.type) {
                    case "video-offer":
                        this.handleVideoOffer(receivedMessage);
                        break;

                    case "video-answer":
                        this.handleVideoAnswer(receivedMessage);
                        break;

                    case "new-ice-candidate":
                        this.handleNewIceCandidate(receivedMessage);
                        break;

                    default:
                        return;
                }
            });
        });
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

    hasUserMedia = () => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    openCamera = () => {
        if (this.hasUserMedia) {
            var mediaConstraints = { video: true, audio: false };
            navigator.mediaDevices.getUserMedia(mediaConstraints)
                .then((stream) => {
                    this.localStreamSource.current.srcObject = stream;
                    this.setState({ localStream: stream });
                })
                .catch(e => console.log(e));
        } else {
            alert("Your browser does not support WebRTC");
        }
    }

    handleCall = () => {
        let { localStream } = this.state;

        let peerConnection = new RTCPeerConnection(iceServerConfig);
        console.log(iceServerConfig, "peer connection")
        this.setState({ peerConnection: peerConnection });

        peerConnection.onicecandidate = this.handleIceCandidate;
        peerConnection.onnegotiationneeded = this.handleNegotiationNeeded;
        peerConnection.ontrack = this.handleTrack;

        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
        })
        this.setState({ localStream: localStream, peerConnection: peerConnection });

    }

    handleIceCandidate = (event) => {
        if (event.candidate) {
            console.log("candidate", event.candidate)
            this.socket.emit("videocall", JSON.stringify({
                type: "new-ice-candidate",
                target: this.state.username,
                candidate: event.candidate
            }));
        }
    }

    handleNegotiationNeeded = () => {
        this.state.peerConnection.createOffer()
            .then(this.onCreateOfferSuccess)
            .catch(e => console.log(e));
    }

    onCreateOfferSuccess = (offerSDP) => {
        this.state.peerConnection.setLocalDescription(offerSDP)
            .then(() => {
                console.log("set local description successfully");
                this.socket.emit("videocall", JSON.stringify({
                    username: this.state.username,
                    target: this.state.targetUsername,
                    type: "video-offer",
                    sdp: offerSDP
                }))
            })
            .catch(e => console.log(e));
    }


    handleVideoOffer = (messageData) => {
        this.setState({ targetUsername: messageData.username });
        this.handleCall();

        let remoteSDP = new RTCSessionDescription(messageData.sdp);
        this.state.peerConnection.setRemoteDescription(remoteSDP)
            .then(this.openCamera)
            .then(this.handleAddTrack)
            .then(() => this.state.peerConnection.createAnswer())
            .then(this.onCreateAnswerSuccess)
            .catch(e => console.log(e));

    }

    onCreateAnswerSuccess = (answerSDP) => {
        this.state.peerConnection.setLocalDescription(answerSDP)
            .then(() => {
                this.socket.emit("videocall", JSON.stringify({
                    username: this.state.username,
                    target: this.state.targetUsername,
                    type: "video-answer",
                    sdp: answerSDP
                }))
            })
            .catch(error => console.log(error));
    }

    handleVideoAnswer = (messageData) => {
        this.setState({ targetUsername: messageData.username });
        this.state.peerConnection.setRemoteDescription(messageData.sdp)

    }

    handleNewIceCandidate = (messageData) => {
        this.state.peerConnection.addIceCandidate(messageData.candidate)
            .then(() => console.log("add ice candidate successfully"))
            .catch(error => console.log(error));
    }


    handleTrack = (event) => {
        if (this.remoteStreamSource.current.srcObject) return;
        this.remoteStreamSource.current.srcObject = event.streams[0];
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
                <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />

                <label>Your friend's username</label>
                <input type="text" name="targetUsername" value={this.state.targetUsername} onChange={this.handleChange} />

                <button className="btn btn-success" onClick={this.openCamera}>Start</button>
                <button className="btn btn-info" onClick={this.handleCall}>Call</button>
            </React.Fragment>
        )
    }
}


export default VideoCall;

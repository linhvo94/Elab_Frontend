import React from "react";
import io from "socket.io-client";

import { iceServerConfig } from "../../environment/ice-server-config.js";

import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { VideoUpgradeDialog } from "./VideoUpgradeDialog.jsx";
import { VideoMessageDialog } from "./VideoMessageDialog.jsx";
import { handleGetUserMedia, handleGetVideoTracks } from "../webrtc-usermedia/usermedia-control.js";
import {
    sendVideoOffer, sendVideoAnswer, sendVideoPickedUpEvent, sendVideoHangupEvent, sendAddOnlineUserEvent, sendNewIceCandidate,
    sendVideoUpgrade, sendVideoUpgradeDecline

} from '../../socket-utils/socket-utils.js';

export default class VideoCall extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sender: "",
            receiver: "",
            videoUpgradeDiaglogOpened: false,
            videoMessageDialogOpened: false,
            onAudio: null,
            onVideo: null,
            videoMessage: ""
        }

        this.socket = null;
        this.peerConnection = null;
        this.ringTone = new Audio(ringing_tone);
        this.localStream = null;
        this.localStreamSource = React.createRef();
        this.remoteStreamSource = React.createRef();
        this.offerSDP = null;
        this.upgradeSDP = null;
        this.isAudioCall = null;
        this.socketOrigin = "";
        this.audioCallConstraint = { video: false, audio: true };
        this.videoCallConstraint = { video: true, audio: true };
    }


    componentDidMount() {

        window.addEventListener("beforeunload", this.handleLeavePage);

        this.socket = io("https://www.e-lab.live:9000");
        // this.socket = io("http://localhost:9000");
        let sender = window.sender;
        let receiver = window.receiver;
        let userType = window.userType;

        if (sender !== "" && receiver !== "") {
            this.setState({ sender: sender, receiver: receiver });

            if (userType === "caller") {
                this.isAudioCall = window.isAudioCall;

                let mediaConstraints = this.configCallConstraints(window.isAudioCall);

                handleGetUserMedia(mediaConstraints).then(stream => {
                    this.localStreamSource.current.srcObject = stream;
                    this.localStream = stream;
                    this.createPeerConnection(stream);
                    playRingTone(this.ringTone);
                }).catch(e => console.log(e));
            }

            if (userType === "callee") {
                this.socketOrigin = window.offerMessage.socketOrigin;
                this.isAudioCall = window.offerMessage.isAudioCall;

                let mediaConstraints = this.configCallConstraints(window.offerMessage.isAudioCall);

                handleGetUserMedia(mediaConstraints).then(stream => {
                    this.localStreamSource.current.srcObject = stream;
                    this.localStream = stream;
                    this.handleVideoOffer(stream, window.offerMessage);
                }).catch(e => console.log(e));
            }

            this.socket.on("connect", () => {
                console.log("open connection");

                sendAddOnlineUserEvent(this.socket, window.sender);

                this.socket.on("video_call", (message) => {
                    console.log("incoming data type Video Call: ", message.type);
                    switch (message.type) {
                        case "video-answer":
                            stopRingTone(this.ringTone);
                            this.socketOrigin = message.socketOrigin;
                            this.peerConnection.setLocalDescription(this.offerSDP);
                            this.handleVideoAnswer(message);
                            break;

                        case "video-decline":
                            stopRingTone(this.ringTone);
                            this.callCleanup();
                            this.setState({
                                videoMessageDialogOpened: true,
                                videoMessage: `${this.state.receiver} declined your call.`
                            });

                            setTimeout(() => {
                                window.close();
                            }, 3000);

                            break;

                        case "video-hangup":
                            stopRingTone(this.ringTone);
                            this.callCleanup();
                            this.setState({
                                videoMessageDialogOpened: true,
                                videoMessage: `${this.state.receiver} has hung up.`
                            });

                            setTimeout(() => {
                                window.close();
                            }, 3000);

                            break;

                        case "new-ice-candidate":
                            console.log("receive ice candidateeeeeeeee...........")
                            this.handleNewIceCandidate(message);
                            break;

                        case "video-upgrade":
                            this.upgradeSDP = message;
                            this.setState({ videoUpgradeDiaglogOpened: true, videoMessageDialogOpened: false });
                            break;

                        case "upgrade-video-decline":
                            this.turnOffVideoTracks();
                            this.setState({
                                videoMessageDialogOpened: true, onVideo: null,
                                videoMessage: `${this.state.receiver} declined your video call request.`
                            });
                            break;

                        case "busy-user":
                            window.removeEventListener('beforeunload', this.handleLeavePage);
                            this.setState({
                                videoMessageDialogOpened: true, onVideo: null,
                                videoMessage: `${this.state.receiver} is on another call`
                            });

                            setTimeout(() => {
                                window.close();
                            }, 2000);

                            break;
                        default:
                            break;
                    }
                });
            });
        }
    }

    configCallConstraints = (isAudioCall) => {
        if (isAudioCall) {
            this.setState({ onAudio: true, onVideo: null });
            return this.audioCallConstraint;

        } else if (isAudioCall === false) {
            this.setState({ onAudio: true, onVideo: true });
            return this.videoCallConstraint;
        }
        return null;
    }

    handleLeavePage = (e) => {
        e.preventDefault();
        if (this.socket !== null && this.socket !== "") {
            sendVideoHangupEvent(this.socket, this.state.sender, this.state.receiver);
        }
    }

    createPeerConnection(stream) {
        console.log("create peer connection");
        this.peerConnection = new RTCPeerConnection(iceServerConfig);
        this.peerConnection.onicecandidate = this.handleIceCandidate;
        this.peerConnection.onnegotiationneeded = this.handleNegotiation;
        this.peerConnection.ontrack = this.handleTrack;
        stream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

        this.peerConnection.createOffer()
            .then(this.onCreateOfferSuccess)
            .catch(e => console.log(e));
    }

    handleIceCandidate = (event) => {
        if (event.candidate) {
            console.log("sending ice candidate.... to: ", this.state.receiver, "      ", this.socketOrigin);
            sendNewIceCandidate(this.socket, this.state.sender, this.state.receiver, this.socketOrigin, event.candidate);
        }
    }

    onCreateOfferSuccess = (offerSDP) => {
        this.offerSDP = offerSDP;
        sendVideoOffer(this.socket, this.state.sender, this.state.receiver, this.isAudioCall, offerSDP);
    }

    handleTrack = (event) => {
        if (this.remoteStreamSource.current.srcObject !== event.streams[0]) {
            this.remoteStreamSource.current.srcObject = null
            this.remoteStreamSource.current.srcObject = event.streams[0];
        }
    }

    handleVideoOffer = (stream, message) => {

        this.setState({ receiver: message.sender });

        this.peerConnection = new RTCPeerConnection(iceServerConfig);
        this.peerConnection.onicecandidate = this.handleIceCandidate;
        this.peerConnection.ontrack = this.handleTrack;

        stream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

        let remoteSDP = new RTCSessionDescription(message.sdp);

        this.peerConnection.setRemoteDescription(remoteSDP)
            .then(() => this.peerConnection.createAnswer())
            .then(this.onCreateAnswerSuccess)
            .then(() => sendVideoPickedUpEvent(this.socket, this.state.sender, this.state.sender))
            .catch(e => console.log(e));
    }

    onCreateAnswerSuccess = (answerSDP) => {
        console.log("create answer success to ", this.state.receiver);
        this.peerConnection.setLocalDescription(answerSDP)
            .then(() => {
                sendVideoAnswer(this.socket, this.state.sender, this.state.receiver, this.socketOrigin, answerSDP);
            });
    }

    onCreateUpgradeVideoAnswerSuccess = (answerSDP) => {
        console.log("create answer success to ", this.state.receiver);
        this.peerConnection.setLocalDescription(answerSDP)
            .then(() => {
                sendVideoAnswer(this.socket, this.state.sender, this.state.receiver, this.socketOrigin, answerSDP);
            });
    }


    handleVideoAnswer = (message) => {
        console.log("receiving and handle video answer", message.sdp);
        let remoteSDP = new RTCSessionDescription(message.sdp);
        this.peerConnection.setRemoteDescription(remoteSDP).catch(e => console.log(e));
    }

    handleNewIceCandidate = (message) => {
        console.log("ice candidate......... received and let me set it", message.candidate);
        let candidate = new RTCIceCandidate(message.candidate);
        this.peerConnection.addIceCandidate(candidate).catch(e => console.log(e));
        this.peerConnection._negotiating = true;
    }

    handleHangup = () => {
        stopRingTone(this.ringTone);
        sendVideoHangupEvent(this.socket, this.state.sender, this.state.receiver);
        this.callCleanup();

        setTimeout(() => {
            window.close();
        }, 1000);
    }

    callCleanup = () => {
        if (this.peerConnection !== undefined && this.peerConnection !== null) {
            this.peerConnection.close();
            this.peerConnection = null;
            let tracks = this.localStream.getVideoTracks();
            tracks.forEach(track => {
                track.stop();
                this.localStream.removeTrack(track);
            });

            this.localStreamSource.current.srcObject = null;
            this.localStreamSource.current.srcObject = this.localStream;
        }
    }

    turnOnVideoTracks = () => {
        this.localStream.getVideoTracks().forEach(track => track.enabled = true);
    }

    turnOffVideoTracks = () => {
        this.localStream.getVideoTracks().forEach(track => track.enabled = false);
    }

    handleUpgradeVideo = (e) => {
        e.preventDefault();

        handleGetUserMedia(this.videoCallConstraint)
            .then(stream => {
                this.localStream = stream;
                this.turnOnVideoTracks();
                this.localStreamSource.current.srcObject = stream;
                stream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
                this.setState({ onVideo: true, onAudio: true });

                return this.peerConnection.createOffer();
            })
            .then(offerSDP => {
                this.offerSDP = offerSDP;
                sendVideoUpgrade(this.socket, this.state.sender, this.state.receiver, this.socketOrigin, offerSDP);
            })
            .catch(e => console.log(e));
    }

    handleCloseVideoUpgradeDiaglog = (e) => {
        e.preventDefault();
        this.setState({ videoUpgradeDiaglogOpened: false });
    }

    handleVideoUpgradeDecline = (e) => {
        e.preventDefault();
        this.setState({ videoUpgradeDiaglogOpened: false });
        sendVideoUpgradeDecline(this.socket, this.state.sender, this.state.receiver, this.socketOrigin);
    }

    handleVideoUpgradeAccept = (e) => {
        e.preventDefault();

        this.setState({ videoUpgradeDiaglogOpened: false });

        let remoteSDP = new RTCSessionDescription(this.upgradeSDP.sdp);
        this.peerConnection.setRemoteDescription(remoteSDP);

        handleGetUserMedia(this.videoCallConstraint)
            .then(stream => {
                this.localStream = stream;
                this.localStreamSource.current.srcObject = stream;
                this.turnOnVideoTracks();
                stream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

                this.setState({ onVideo: true, onAudio: true });

                return this.peerConnection.createAnswer();
            })
            .then(this.onCreateAnswerSuccess)
            .catch(e => console.log(e));
    }

    handleCloseMessageDiaglog = (e) => {
        e.preventDefault();
        this.setState({ videoMessageDialogOpened: false });
    }

    handleAudioState = (e) => {
        e.preventDefault();
        this.setState({ onAudio: !this.state.onAudio });
        this.localStream.getAudioTracks()[0].enabled = !this.localStream.getAudioTracks()[0].enabled;
    }

    handleVideoState = (e) => {
        e.preventDefault();
        this.setState({ onVideo: !this.state.onVideo });
        this.localStream.getVideoTracks()[0].enabled = !this.localStream.getVideoTracks()[0].enabled;
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleLeavePage);
    }

    render() {
        return (
            <React.Fragment >
                <div className="call-screen-page">
                    <VideoUpgradeDialog
                        videoUpgradeDiaglogOpened={this.state.videoUpgradeDiaglogOpened}
                        handleCloseVideoUpgradeDiaglog={this.handleCloseVideoUpgradeDiaglog}
                        handleVideoUpgradeDecline={this.handleVideoUpgradeDecline}
                        handleVideoUpgradeAccept={this.handleVideoUpgradeAccept}
                        username={this.state.receiver}
                    />

                    <VideoMessageDialog
                        username={this.state.receiver}
                        videoMessageDialogOpened={this.state.videoMessageDialogOpened}
                        handleCloseMessageDiaglog={this.handleCloseMessageDiaglog}
                        videoMessage={this.state.videoMessage}
                    />

                    <div className="row justify-content-center call-screen-container">
                        <div className="col-6 videocall-localstream-container">
                            <video className="videocall-localstream" ref={this.localStreamSource} muted autoPlay>

                            </video>
                        </div>

                        <div className="col-6 videocall-remotestream-container">
                            <video className="videocall-remotestream" ref={this.remoteStreamSource} autoPlay>

                            </video>
                        </div>
                    </div>

                    <div className="d-flex justify-content-center">
                        <button type="button" className="btn btn-danger hangup-button" onClick={this.handleHangup}>
                            <i className="fas fa-phone-slash"></i>
                        </button>

                        {this.state.onAudio === null ? null
                            : this.state.onAudio ?
                                <button type="button" className="btn btn-default audio-button ml-5" onClick={this.handleAudioState}>
                                    <i className="fas fa-microphone"></i>
                                </button>

                                : <button type="button" className="btn btn-default audio-button ml-5" onClick={this.handleAudioState}>
                                    <i className="fas fa-microphone-slash"></i>
                                </button>
                        }


                        {this.state.onVideo === null ?
                            <button type="button" className="btn btn-success upgrade-video-button ml-5" onClick={this.handleUpgradeVideo}>
                                <i className="fas fa-video"></i>
                            </button>
                            :
                            <button type="button" className={this.state.onVideo ? "btn btn-success upgrade-video-button ml-5" : "btn btn-default stop-video-button ml-5"}
                                onClick={this.handleVideoState}>
                                {this.state.onVideo ? <i className="fas fa-video"></i> : <i className="fas fa-user-slash"></i>}
                            </button>
                        }
                    </div>

                </div>

            </React.Fragment >
        )
    }
}
import React from "react";
import { Link, Route } from "react-router-dom";
import io from "socket.io-client";
import uuid from "uuid/v4";

import Chat from "./Chat.jsx";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { CalleeDialog } from "./CalleeDialog.jsx";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { sendVideoHangupEvent, sendAddOnlineUserEvent, sendVideoDeclineEvent } from '../../utils/socket-utils/socket-utils.js';
import { iceServerConfig } from "../../environment/ice-server-config.js";


export default class Media extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            firstName: "",
            lastName: "",
            receiver: "",

            onlineUsers: [],
            filterUsers: [],
            searchUser: "",

            textMessage: "",
            chatMessages: [],
            dataChannelNotReady: true,
            triggeredPeerConnection: false,
            selectedUser: "",

            callDiaglogOpened: false,

            offerResponded: false,
            isOnCall: false,

        }
        this.peerConnections = [];
        this.dataChannel = null;
        this.offerSDP = null;

        this.peerConnection = null;
        this.ringTone = new Audio(ringing_tone);
        this.offerMessage = null;
        this.isAudioCall = null;
    }
    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));


        this.setState({ username: user.username, firstName: user.firstName, lastName: user.lastName });
        this.socket = io("http://localhost:9000");
        // this.socket = io(SIGNALING_SERVER_URL);
        // this.socket = io("https://www.e-lab.live:9000");

        this.socket.on("connect", () => {
            sendAddOnlineUserEvent(this.socket, user.username);

            this.socket.on("online_users", (message) => {
                console.log(message);
                let onlineUsers = message.filter(m => m !== this.state.username);
                this.setState({ onlineUsers: onlineUsers, filterUsers: onlineUsers });
            });

            this.socket.on("video_call", (message) => {
                console.log("message type.....", message.type);
                switch (message.type) {
                    case "video-offer":
                        console.log("audio ", message.isAudioCall);
                        this.offerMessage = message;
                        playRingTone(this.ringTone);

                        this.setState({ receiver: message.sender, callDiaglogOpened: true });

                        // setTimeout(() => {
                        //     if (this.state.offerResponded === false) {
                        //         sendVideoHangupEvent(this.socket, this.state.username, this.state.receiver);
                        //         stopRingTone(this.ringTone);
                        //         this.setState({ callDiaglogOpened: false });
                        //     }
                        // }, 30000);

                        break;

                    case "video-hangup":
                        stopRingTone(this.ringTone);
                        this.setState({ callDiaglogOpened: false, offerResponded: true, isOnCall: false });
                        break;

                    case "video-picked-up":
                        stopRingTone(this.ringTone);
                        this.setState({ callDiaglogOpened: false, offerResponded: true, isOnCall: true });
                        break;

                    case "on-call":
                        if (message.isOnCall !== undefined && message.isOnCall !== null) {
                            this.setState({ isOnCall: message.isOnCall });
                        }
                        break;

                    case "busy-user":
                        this.setState({ isOnCall: false });
                        break;

                    default:
                        return;
                }

            });

            this.socket.on("chat", (message) => {
                console.log("incoming message.... ", message)
                switch (message.type) {
                    case "chat-offer":
                        this.handleChatOffer(message);
                        break;
                    case "chat-answer":
                        this.handleChatAnswer(message);
                        break;
                    case "new-ice-candidate":
                        this.handleNewIceCandidate(message);
                        break;
                    default:
                        return;
                }
            });

        });
    }


    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
        if (e.target.name === "searchUser") {
            if (e.target.value !== null && e.target.value !== "") {
                let filterUsers = this.state.onlineUsers.filter(user => (user.toLowerCase()).includes((e.target.value).toLowerCase()));
                this.setState({ filterUsers: filterUsers });
            } else {
                this.setState({ filterUsers: this.state.onlineUsers });
            }
        }
    }

    createPeerConnection = (remoteUsername) => {
        console.log("create peer connection....");
        let peer = {};
        peer["remoteUsername"] = remoteUsername;
        peer["peerConnection"] = new RTCPeerConnection(iceServerConfig);
        peer["dataChannel"] = peer.peerConnection.createDataChannel(`chat-${uuid()}`);
        peer["chatMessages"] = [];
        this.peerConnections.push(peer);
        this.setState({ selectedUser: remoteUsername });
        console.log(this.peerConnections);
        peer.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event, remoteUsername);
        peer.dataChannel.onopen = () => {
            if (peer.dataChannel.readyState === "open") {
                console.log("Data channel is open");
                peer["dataChannelNotReady"] = true;
            }
        }

        peer.dataChannel.onmessage = (event) => this.handleMessage(event, peer, remoteUsername);
        peer.dataChannel.onerror = (err) => {
            console.log(err);
        }
        peer.dataChannel.onclose = () => {
            console.log("Data channel is closed");
        }

        peer.peerConnection.createOffer()
            .then((offerSDP) => {
                peer.peerConnection.setLocalDescription(offerSDP);
                return offerSDP;
            })
            .then((offerSDP) => this.socket.emit("chat_signal", {
                type: "chat-offer",
                sender: this.state.username,
                receiver: remoteUsername,
                sdp: offerSDP
            }))
            .catch(e => console.log(e));
    }

    handleDataChannelState = () => {
        if (this.dataChannel !== null) {
            if (this.dataChannel.readyState === "open") {
                console.log("Data channel is open");
                this.setState({ dataChannelNotReady: false });
            }
        }
    }

    onCreateOfferSuccess = (offerSDP, receiver) => {
        // let peer = this.findPeer(receiver);
        console.log("create offer success, ", offerSDP, " SOCKET, :", this.socket);
        // peer.peerConnection.setLocalDescription(offerSDP)
        //     .then(() => this.socket.emit("chat_signal", {
        //         type: "chat-offer",
        //         sender: this.state.username,
        //         receiver: receiver,
        //         sdp: offerSDP
        //     }))
        //     .catch(e => console.log(e));
    }

    handleChatOffer = (message) => {
        let peer = {};
        peer["username"] = message.sender;
        peer["peerConnection"] = new RTCPeerConnection(iceServerConfig);
        peer["chatMessages"] = [];
        this.peerConnections.push(peer);
        console.log(this.peerConnections);

        peer.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event, message.sender);
        peer.peerConnection.ondatachannel = (event) => {
            peer["dataChannel"] = event.channel;
            console.log("on message data channel", event.channel);
            peer.dataChannel.onopen = () => {
                if (peer.dataChannel.readyState === "open") {
                    console.log("Data channel is open");
                    peer["dataChannelNotReady"] = true;
                }
            }
            peer.dataChannel.onmessage = (event) => this.handleMessage(event, peer, message.sender);
            peer.dataChannel.onerror = (err) => {
                console.log(err);
            }
        }

        let remoteSDP = new RTCSessionDescription(message.sdp);
        peer.peerConnection.setRemoteDescription(remoteSDP)
            .then(() => peer.peerConnection.createAnswer())
            .then((answerSDP) => {
                peer.peerConnection.setLocalDescription(answerSDP)
                return answerSDP
            })
            .then((answerSDP) => this.socket.emit("chat_signal", {
                type: "chat-answer",
                sender: this.state.username,
                receiver: message.sender,
                sdp: answerSDP
            }))
            .catch(e => console.log(e));
    }

    handleChatAnswer = (message) => {
        let peer = this.findPeer(message.sender);
        let remoteSDP = new RTCSessionDescription(message.sdp);
        console.log("PEER", peer, remoteSDP);
        peer.peerConnection.setRemoteDescription(remoteSDP);
    }

    handleNewIceCandidate = (message) => {
        let candidate = new RTCIceCandidate(message.candidate);
        let peer = this.findPeer(message.sender);
        peer.peerConnection.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    handleIceCandidate = (event, receiver) => {
        if (event.candidate) {
            this.socket.emit("chat_signal", {
                type: "new-ice-candidate",
                sender: this.state.username,
                receiver: receiver,
                candidate: event.candidate
            });
        }
    }


    receiveChannelCallback = (event) => {
        this.dataChannel = event.channel;
        console.log("on message data channel", event.channel);
        this.dataChannel.onopen = this.handleDataChannelState;
        this.dataChannel.onmessage = this.handleMessage;
        this.dataChannel.onerror = (err) => {
            console.log(err);
        }
    }

    handleMessage = (event, peer, receiver) => {
        console.log("incoming data", event.data, "   ", receiver);
        let message = {};
        message["islocalpeer"] = false;
        message["message"] = event.data;
        peer.chatMessages.push(message);
        // this.setState({ chatMessages: [...this.state.chatMessages, message] });
    }

    handleSendMessage = (e, receiver) => {
        e.preventDefault();
        // if (!this.state.triggeredPeerConnection) {
        //     this.setState({ triggeredPeerConnection: true });
        // }
        let peer = this.findPeer(receiver);
        // let message = {};
        // message["islocalpeer"] = true;
        // message["message"] = this.state.textMessage;
        // this.setState({ chatMessages: [...this.state.chatMessages, message] });
        peer.dataChannel.send(this.state.textMessage);
    }

    findPeer = (receiver) => {
        return this.peerConnections.find(peerConnection => peerConnection.remoteUsername === receiver);
    }


    onCreateAnswerSuccess = (answerSDP, receiver) => {
        let peer = this.findPeer(receiver);
        peer.peerConnection.setLocalDescription(answerSDP)
            .then(() => this.socket.emit("chat_signal", {
                type: "chat-answer",
                sender: this.state.username,
                receiver: receiver,
                sdp: answerSDP
            }))
            .catch(e => console.log(e));
    }

    handleCallAccept = (e) => {
        e.preventDefault();

        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false, offerResponded: true, isOnCall: true });

        var videoCallWindow = window.open("/videocall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576");
        videoCallWindow.sender = this.state.username;
        videoCallWindow.receiver = this.state.receiver;
        videoCallWindow.offerMessage = this.offerMessage;
        videoCallWindow.isAudioCall = this.offerMessage.isAudioCall;
        videoCallWindow.userType = "callee";
    }

    handleCallDecline = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false, offerResponded: true });
        sendVideoDeclineEvent(this.socket, this.state.username, this.state.receiver, this.offerMessage.socketOrigin);
    }


    handleCloseCallDiaglog = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false });
    }

    render() {
        console.log(this.state.chatMessages);
        return (
            <React.Fragment>
                <CalleeDialog
                    callDiaglogOpened={this.state.callDiaglogOpened}
                    calleeMessage={this.offerMessage === null ? null : this.offerMessage.isAudioCall ? `${this.state.receiver} is calling you` : `${this.state.receiver} is video calling you`}
                    handleCallAccept={this.handleCallAccept}
                    handleCloseCallDiaglog={this.handleCloseCallDiaglog}
                    handleCallDecline={this.handleCallDecline} />

                <div className="media-page-container">
                    <div className="media-conversation-list-container">
                        <div className="user clearfix">
                            <div className="user-avatar">{this.state.username[0]}</div>
                            <div className="about">
                                <div className="name">{this.state.firstName} {this.state.lastName}</div>
                                <div className="status">
                                    <i className="fa fa-circle online"></i> online
                                </div>
                            </div>
                        </div>

                        <div className="people-list clearfix" id="people-list">
                            <div className="search">
                                <input className="form-control" type="text" onChange={this.handleChange} name="searchUser" value={this.state.searchUser} placeholder="Search..." />
                            </div>
                            <ul className="list">
                                {this.state.filterUsers.map((user, index) =>
                                    <li key={index} className="clearfix">
                                        <Link to={`${this.props.match.url}/${user}`} onClick={() => this.createPeerConnection(user)}>
                                            <div className="user-avatar">{user[0]}</div>
                                            <div className="about">
                                                <div className="name">{user}</div>
                                                <div className="status">
                                                    <i className="fa fa-circle online"></i> online
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="media-chat-container">
                        <Route path={`${this.props.match.path}/:username`}
                            render={(props) => <Chat {...props}
                                handleChange={this.handleChange}
                                createPeerConnection={this.createPeerConnection}
                                handleSendMessage={this.handleSendMessage}
                                dataChannelNotReady={this.state.dataChannelNotReady}
                                textMessage={this.state.textMessage}
                                chatMessages={(this.findPeer(this.state.selectedUser)) !== undefined ? (this.findPeer(this.state.selectedUser)).chatMessages : []}
                                onlineUsers={this.state.onlineUsers}
                                isOnCall={this.state.isOnCall} />} />
                    </div>
                </div>
            </React.Fragment>

        )
    }
}
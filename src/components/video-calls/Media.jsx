import React from "react";
import { Link, Route } from "react-router-dom";
import io from "socket.io-client";
import uuid from "uuid/v4";

import Chat from "./Chat.jsx";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { CalleeDialog } from "./CalleeDialog.jsx";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { sendVideoDeclineEvent, sendChatOffer, sendChatAnswer, sendChatNewIceCandidate } from '../../utils/socket-utils/socket-utils.js';
import { iceServerConfig } from "../../environment/ice-server-config.js";

export default class Media extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sender: {},
            receiver: {},
            usersFromDB: [],
            onlineUsers: [],
            filterUsers: [],
            onlineUsersFromSocket: [],
            searchUser: "",

            textMessage: "",
            chatMessages: {},

            callDiaglogOpened: false,
            offerResponded: false,
            isOnCall: false,
            socket: null

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
        this.props.fetchAllUsers();
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null) {
            this.setState({ sender: user });
        }

        if (this.props.socket !== undefined && this.props.socket !== null) {
            this.setState({ socket: this.props.socket });
            this.handleSocketEvent(this.props.socket);
        }

        if (this.props.onlineUsersFromSocket !== undefined && this.props.onlineUsersFromSocket !== null) {
            this.setState({ onlineUsersFromSocket: this.props.onlineUsersFromSocket });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.users !== undefined && this.props.users !== null && this.props.users !== prevProps.users) {
            this.setState({ usersFromDB: this.props.users });
            this.handleOnlineUsers(this.props.users, this.state.onlineUsersFromSocket);
        }

        if (this.props.socket !== undefined && this.props.socket !== null && this.props.socket !== prevProps.socket) {
            this.setState({ socket: this.props.socket });
            this.handleSocketEvent(this.props.socket);
        }

        if (this.props.onlineUsersFromSocket !== undefined && this.props.onlineUsersFromSocket !== null
            && this.props.onlineUsersFromSocket !== prevProps.onlineUsersFromSocket) {
            this.setState({ onlineUsersFromSocket: this.props.onlineUsersFromSocket });
            this.handleOnlineUsers(this.state.usersFromDB, this.props.onlineUsersFromSocket);
        }

    }

    handleSocketEvent = (socket) => {
        socket.on("connect", () => {
            socket.on("video_call", (message) => {
                console.log("message type.....", message.type);
                switch (message.type) {
                    case "video-offer":
                        this.offerMessage = message;
                        let receiver = this.state.usersFromDB.find(user => user.username === message.sender);
                        this.setState({ receiver: receiver, callDiaglogOpened: true });
                        playRingTone(this.ringTone);

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

            socket.on("chat", (message) => {
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

    handleOnlineUsers = (usersFromDB, onlineUsersFromSocket) => {
        let actualOnlineUsers = [];
        if (onlineUsersFromSocket.length > 0) {
            onlineUsersFromSocket.forEach(userSocket => {
                let onlineUser = usersFromDB.find(userDB => userDB.username === userSocket && userDB.username !== this.state.sender.username);
                if (onlineUser !== undefined && onlineUser !== null 
                        && onlineUser !== this.state.sender.username && actualOnlineUsers.indexOf(onlineUser) === -1) {
                    actualOnlineUsers.push(onlineUser);
                }
            });
        }

        this.setState({ onlineUsers: actualOnlineUsers });

        if (this.state.searchUser === "") {
            this.setState({ filterUsers: actualOnlineUsers });
        }

        let updatedPeerConnections = [];

        actualOnlineUsers.forEach(user => {
            this.peerConnections.forEach(peer => {
                if (peer.remoteUsername === user.username) {
                    updatedPeerConnections.push(peer);
                }
            });
        });


        this.peerConnections = updatedPeerConnections;
    }


    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
        if (e.target.name === "searchUser") {
            if (e.target.value !== null && e.target.value !== "") {
                let filterUsers = this.state.onlineUsers.filter(user => {
                    let userName = `${user.firstName} ${user.lastName}`;
                    return (userName.toLowerCase()).includes((e.target.value).toLowerCase())
                });

                this.setState({ filterUsers });
            } else {
                this.setState({ filterUsers: this.state.onlineUsers });
            }
        }
    }

    createPeerConnection = (remoteUsername) => {
        if (remoteUsername !== "" && remoteUsername !== null && this.isUserOnline(remoteUsername)) {
            if (this.findPeer(remoteUsername)) {
                console.log("Peer Connection already exists")
                return;
            } else {
                console.log("create peer connection....");
                let peer = {};
                peer["remoteUsername"] = remoteUsername;
                peer["peerConnection"] = new RTCPeerConnection(iceServerConfig);
                peer["dataChannel"] = peer.peerConnection.createDataChannel(`chat-${uuid()}`);
                this.peerConnections.push(peer);

                let chatMessages = this.state.chatMessages;
                chatMessages[remoteUsername] = [];

                this.setState({ chatMessages: chatMessages });

                peer.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event, remoteUsername);
                peer.dataChannel.onopen = () => {
                    if (peer.dataChannel.readyState === "open") {
                        console.log("Data channel is open");
                    }
                }

                peer.dataChannel.onmessage = (event) => this.handleMessage(event, remoteUsername);

                peer.dataChannel.onerror = (err) => {
                    console.log(err);
                }
                peer.dataChannel.onclose = () => {
                    console.log("Data channel is closed");
                }


                peer.peerConnection.createOffer()
                    .then(offerSDP => {
                        console.log("Offer SDP", offerSDP);
                        this.offerSDP = offerSDP;
                        sendChatOffer(this.state.socket, this.state.sender.username, remoteUsername, offerSDP);
                    })
                    .catch(e => console.log(e));
            }
        } else {
            // alert("The current user is not online.");
        }
    }

    handleDataChannelState = () => {
        if (this.dataChannel !== null) {
            if (this.dataChannel.readyState === "open") {
                console.log("Data channel is open");
                this.setState({ dataChannelNotReady: false });
            }
        }
    }

    handleChatOffer = (message) => {
        let peer = {};
        peer["remoteUsername"] = message.sender;
        peer["peerConnection"] = new RTCPeerConnection(iceServerConfig);

        this.peerConnections.push(peer);
        console.log(this.peerConnections);

        let chatMessages = this.state.chatMessages;
        chatMessages[message.sender] = [];
        this.setState({ chatMessages: chatMessages });

        peer.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event, message.sender);
        peer.peerConnection.ondatachannel = (event) => {
            peer["dataChannel"] = event.channel;

            console.log("on message data channel", event.channel);
            peer.dataChannel.onopen = () => {
                if (peer.dataChannel.readyState === "open") {
                    console.log("Data channel is open");
                }
            }

            peer.dataChannel.onmessage = (event) => this.handleMessage(event, message.sender);
            peer.dataChannel.onerror = (err) => {
                console.log(err);
            }
        }

        let remoteSDP = new RTCSessionDescription(message.sdp);
        peer.peerConnection.setRemoteDescription(remoteSDP)
            .then(() => peer.peerConnection.createAnswer())
            .then(answerSDP => {
                peer.peerConnection.setLocalDescription(answerSDP);
                return answerSDP;
            })
            .then(answerSDP => 
                sendChatAnswer(this.state.socket, this.state.sender.username, message.sender, answerSDP))
            .catch(e => console.log(e));
    }

    handleChatAnswer = (message) => {
        let peer = this.findPeer(message.sender);
        if (peer.peerConnection !== undefined && peer.peerConnection !== null) {
            peer.peerConnection.setLocalDescription(this.offerSDP);
            let remoteSDP = new RTCSessionDescription(message.sdp);
            peer.peerConnection.setRemoteDescription(remoteSDP);
        } else {
            alert("Peer Connection is not available");
        }

    }

    handleNewIceCandidate = (message) => {
        let peer = this.findPeer(message.sender);
        if (peer.peerConnection !== undefined && peer.peerConnection !== null) {
            let candidate = new RTCIceCandidate(message.candidate);
            peer.peerConnection.addIceCandidate(candidate)
                .catch(e => console.log(e));
        } else {
            alert("Peer Connection is not available");
        }
    }

    handleIceCandidate = (event, receiver) => {
        if (event.candidate !== null) {
            sendChatNewIceCandidate(this.state.socket, this.state.sender.username, receiver, event.candidate);
        }
    }

    handleMessage = (event, receiver) => {
        let chatMessages = this.state.chatMessages;
        let message = {};
        message["islocalpeer"] = false;
        message["message"] = event.data;
        chatMessages[receiver].push(message);
        this.setState({ chatMessages: chatMessages });
    }

    handleSendMessage = (e, receiver) => {
        e.preventDefault();
        if (this.state.textMessage !== "") {
            let peer = this.findPeer(receiver);
            if (peer !== undefined && peer !== null && peer.peerConnection !== undefined && peer.peerConnection !== null) {
                if (peer.dataChannel !== undefined && peer.dataChannel !== null && peer.dataChannel.readyState === "open") {
                    peer.dataChannel.send(this.state.textMessage);
                    let chatMessages = this.state.chatMessages;
                    let message = {};
                    message["islocalpeer"] = true;
                    message["message"] = this.state.textMessage;
                    console.log(chatMessages);
                    chatMessages[receiver].push(message);
                    this.setState({ textMessage: "", chatMessages: chatMessages });
                } else {
                    alert("Data Channel is not available");
                }
            } else {
                alert("Peer Connection is not available");
            }
        }

    }

    findPeer = (receiver) => {
        return this.peerConnections.find(peerConnection => peerConnection.remoteUsername === receiver);
    }


    isUserOnline = (username) => {
        let isOnline = this.state.onlineUsers.some(user => { return user.username === username });
        return isOnline;
    }


    handleCallAccept = (e) => {
        e.preventDefault();

        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false, offerResponded: true, isOnCall: true });

        var videoCallWindow = window.open("/videocall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576");
        videoCallWindow.sender = this.state.sender.username;
        videoCallWindow.receiver = this.state.receiver.username;
        videoCallWindow.offerMessage = this.offerMessage;
        videoCallWindow.isAudioCall = this.offerMessage.isAudioCall;
        videoCallWindow.userType = "callee";
    }

    handleCallDecline = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false, offerResponded: true });
        sendVideoDeclineEvent(this.state.socket, this.state.sender.username, this.state.receiver.username, this.offerMessage.socketOrigin);
    }

    handleCloseCallDiaglog = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false });
    }

    componentWillUnmount() {
        this.peerConnections.forEach(peer => {
            if (peer.dataChannel !== undefined && peer.dataChannel !== null) {
                peer.dataChannel.close();
            }

            if (peer.peerConnection !== undefined && peer.peerConnection !== null) {
                peer.peerConnection.close();
                peer.peerConnection = null;
            }
        });
    }

    render() {
        return (
            <React.Fragment>
                <CalleeDialog
                    callDiaglogOpened={this.state.callDiaglogOpened}
                    calleeMessage={this.offerMessage === null ? null
                        : this.offerMessage.isAudioCall ? `${this.state.receiver.firstName} ${this.state.receiver.lastName} is requesting an audio call...`
                            : `${this.state.receiver.firstName} ${this.state.receiver.lastName} is requesting a video call...`}

                    handleCallAccept={this.handleCallAccept}
                    handleCloseCallDiaglog={this.handleCloseCallDiaglog}
                    handleCallDecline={this.handleCallDecline} />

                <div className="media-page-container">
                    <div className="media-conversation-list-container">
                        <div className="user clearfix">
                            <div className="user-avatar">
                                {Object.keys(this.state.sender).length === 0 && this.state.sender.firstName === undefined ?
                                    "..." : this.state.sender.firstName[0]}
                            </div>

                            <div className="about">
                                <div className="name">
                                    {Object.keys(this.state.sender).length === 0 ? "..."
                                        : `${this.state.sender.firstName} ${this.state.sender.lastName}`}
                                </div>

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
                                        <Link to={`${this.props.match.url}/${user.username}`} onClick={() => this.createPeerConnection(user.username)}>
                                            <div className="user-avatar">{user.firstName === undefined ? "Unknown" : user.firstName[0]}</div>
                                            <div className="about">
                                                <div className="name">{user.firstName} {user.lastName}</div>
                                                {this.state.chatMessages[user.username] !== undefined && this.state.chatMessages[user.username].length > 0 ?
                                                    <div className="new-message">
                                                        {this.state.chatMessages[user.username][this.state.chatMessages[user.username].length - 1].message}
                                                    </div>
                                                    :
                                                    <div className="status">
                                                        <i className="fa fa-circle online"></i> online
                                                    </div>
                                                }
                                            </div>
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="media-chat-container">
                        <div className="no-message">
                            <img src="https://cdn.dribbble.com/users/2217210/screenshots/6770753/working_together_4x.jpg" alt="" />
                        </div>
                        
                        <Route path={`${this.props.match.path}/:username`}
                            render={(props) => <Chat {...props}
                                handleChange={this.handleChange}
                                createPeerConnection={this.createPeerConnection}
                                handleSendMessage={this.handleSendMessage}
                                textMessage={this.state.textMessage}
                                chatMessages={this.state.chatMessages}
                                onlineUsers={this.state.onlineUsers}
                                isOnCall={this.state.isOnCall} />} />
                    </div>
                </div>
            </React.Fragment>

        )
    }
}
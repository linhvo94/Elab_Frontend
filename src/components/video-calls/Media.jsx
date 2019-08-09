import React from "react";
import { Link, Route } from "react-router-dom";
import io from "socket.io-client";

import Sidebar from "./Sidebar.jsx";
import Chat from "./Chat.jsx";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { CalleeDialog } from "./CalleeDialog.jsx";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { sendVideoHangupEvent, sendAddOnlineUserEvent, sendVideoDeclineEvent } from '../../socket-utils/socket-utils.js';

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

            callDiaglogOpened: false,
            searchUserBoxOpened: false,
            userDiaglogOpened: false,
            displaySidebar: true,

            offerResponded: false,
            isOnCall: false,

            linkSelected: ""
        }

        this.peerConnection = null;
        this.ringTone = new Audio(ringing_tone);
        this.offerMessage = null;
        this.isAudioCall = null;
    }
    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));


        this.setState({ username: user.username, firstName: user.firstName, lastName: user.lastName });
        // this.socket = io("http://localhost:9000");
        // this.socket = io(SIGNALING_SERVER_URL);
        this.socket = io("https://www.e-lab.live:9000");

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
                        break;
                }

            });
        });
    }


    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
        if (e.target.name === "searchUser") {
            if (e.target.value !== null && e.target.value !== "") {
                let filterUsers = this.state.onlineUsers.filter(user => user.includes(e.target.value));
                this.setState({ filterUsers: filterUsers });
            } else {
                this.setState({ filterUsers: this.state.onlineUsers });
            }
        }
    }

    handleCallDecline = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false, offerResponded: true });
        sendVideoDeclineEvent(this.socket, this.state.username, this.state.receiver, this.offerMessage.socketOrigin);
    }

    handleCallAccept = (e) => {
        e.preventDefault();

        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false, offerResponded: true, isOnCall: true });

        var videoCallWindow = window.open("/videocall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576, top=30");
        videoCallWindow.sender = this.state.username;
        videoCallWindow.receiver = this.state.receiver;
        videoCallWindow.offerMessage = this.offerMessage;
        videoCallWindow.isAudioCall = this.offerMessage.isAudioCall;
        videoCallWindow.userType = "callee";
    }


    handleCloseCallDiaglog = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false });
    }

    handleCloseUserDialog = (e) => {
        e.preventDefault();
        this.setState({ userDiaglogOpened: false });
    }

    render() {
        return (
            <React.Fragment>
                <CalleeDialog
                    callDiaglogOpened={this.state.callDiaglogOpened}
                    calleeMessage={this.offerMessage === null ? null : this.offerMessage.isAudioCall ? `${this.state.receiver} is calling you` : `${this.state.receiver} is video calling you`}
                    handleCallAccept={this.handleCallAccept}
                    handleCloseCallDiaglog={this.handleCloseCallDiaglog}
                    handleCallDecline={this.handleCallDecline} />

                <div className="col-md-3 col-lg-3 media-conversation-list-container">
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
                                    <Link to={`${this.props.match.url}/${user}`}>
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

                <div className="col-md-8 col-lg-8 media-chat-container">
                    <Route path={`${this.props.match.path}/:username`}
                        render={(props) => <Chat {...props}
                            onlineUsers={this.state.onlineUsers}
                            isOnCall={this.state.isOnCall} />} />
                </div>

            </React.Fragment>

        )
    }
}
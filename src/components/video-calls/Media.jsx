import React from "react";
import io from "socket.io-client";

import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { CalleeDialog } from "./CalleeDialog.jsx";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { SearchUserBox } from "./SearchUserBox.jsx";
import { UserDialog } from "./UserDialog.jsx";
import { sendVideoHangupEvent, sendAddOnlineUserEvent, sendVideoDeclineEvent } from '../../socket-utils/socket-utils.js';

export default class Media extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            firstName: "",
            receiver: "",
            userSelected: "",

            onlineUsers: [],
            filterUsers: [],
            filterUsersSidebar: [],
            searchUser: "",
            searchUserSidebar: "",


            callDiaglogOpened: false,
            searchUserBoxOpened: false,
            userDiaglogOpened: false,
            displaySidebar: true,

            offerResponded: false,
            isOnCall: false

        }

        this.peerConnection = null;
        this.ringTone = new Audio(ringing_tone);
        this.offerMessage = null;
        this.isAudioCall = null;
    }

    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));

        this.setState({ username: user.username, firstName: user.firstName });
        // this.socket = io("http://localhost:9000");
        // this.socket = io(SIGNALING_SERVER_URL);
        this.socket = io("https://www.e-lab.live:9000");

        this.socket.on("connect", () => {
            sendAddOnlineUserEvent(this.socket, user.username);

            this.socket.on("online_users", (message) => {
                console.log(message);
                let onlineUsers = message.filter(m => m !== this.state.username);
                this.setState({ onlineUsers: onlineUsers, filterUsers: onlineUsers, filterUsersSidebar: onlineUsers });
            });

            this.socket.on("video_call", (message) => {
                console.log("message type.....", message.type);
                switch (message.type) {
                    case "video-offer":
                        console.log("audio ", message.isAudioCall);
                        this.offerMessage = message;
                        playRingTone(this.ringTone);

                        this.setState({ receiver: message.sender, callDiaglogOpened: true });

                        setTimeout(() => {
                            if (this.state.offerResponded === false) {
                                sendVideoHangupEvent(this.socket, this.state.username, this.state.receiver);
                                stopRingTone(this.ringTone);
                                this.setState({ callDiaglogOpened: false });
                            }
                        }, 30000);

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

        } else if (e.target.name === "searchUserSidebar") {
            if (e.target.value !== null && e.target.value !== "") {
                let filterUsersSidebar = this.state.onlineUsers.filter(user => user.includes(e.target.value));
                this.setState({ filterUsersSidebar: filterUsersSidebar });
            } else {
                this.setState({ filterUsersSidebar: this.state.onlineUsers });
            }
        }
    }

    makeACall = (e, receiver) => {
        e.preventDefault();
        console.log("making a call to......", receiver);
        this.setState({ searchUserBoxOpened: false, searchUser: "", filterUsers: this.state.onlineUsers, isOnCall: true });
        var videoCallWindow = window.open("/videocall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576, top=30");
        videoCallWindow.sender = this.state.username;
        videoCallWindow.receiver = receiver;
        videoCallWindow.userType = "caller";
        videoCallWindow.isAudioCall = this.isAudioCall;
    }

    handleUserSelectedCall = (e, isAudioCall) => {
        e.preventDefault();
        this.isAudioCall = isAudioCall;
        this.setState({ userDiaglogOpened: false });
        this.makeACall(e, this.state.userSelected);
    }

    handleVideoCall = (e) => {
        e.preventDefault();
        this.isAudioCall = false;
        this.setState({ searchUserBoxOpened: true });
    }

    handleAudioCall = (e) => {
        e.preventDefault();
        this.isAudioCall = true;
        this.setState({ searchUserBoxOpened: true });
    }

    handleCallDecline = (e) => {
        e.preventDefault();
        this.ringTone.pause();
        this.ringTone.currentTime = 0;
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

    handleCloseSearchUserBox = (e) => {
        e.preventDefault();
        this.setState({ searchUserBoxOpened: false, searchUser: "", filterUsers: this.state.onlineUsers });
    }

    toggleSidebar = () => {
        this.setState({ displaySidebar: !this.state.displaySidebar })
    }

    handleUserSelected = (user) => {
        this.setState({ userDiaglogOpened: true, userSelected: user });

    }

    handleCloseUserDialog = (e) => {
        e.preventDefault();
        this.setState({ userDiaglogOpened: false, userSelected: "" });
    }

    render() {
        return (
            <React.Fragment>
                <div className="media-page">
                    <UserDialog userDiaglogOpened={this.state.userDiaglogOpened}
                        userSelected={this.state.userSelected}
                        handleCloseUserDialog={this.handleCloseUserDialog}
                        handleAudioCall={this.handleAudioCall}
                        handleVideoCall={this.handleVideoCall}
                        handleUserSelectedCall={this.handleUserSelectedCall} />

                    <SearchUserBox
                        searchUserBoxOpened={this.state.searchUserBoxOpened}
                        handleCloseSearchUserBox={this.handleCloseSearchUserBox}
                        makeACall={this.makeACall}
                        filterUsers={this.state.filterUsers}
                        handleChange={this.handleChange}
                        searchUser={this.state.searchUser} />

                    <CalleeDialog
                        callDiaglogOpened={this.state.callDiaglogOpened}
                        calleeMessage={this.offerMessage === null ? null : this.offerMessage.isAudioCall ? `${this.state.receiver} is calling you` : `${this.state.receiver} is video calling you`}
                        handleCallAccept={this.handleCallAccept}
                        handleCloseCallDiaglog={this.handleCloseCallDiaglog}
                        handleCallDecline={this.handleCallDecline} />

                    <div className="row">
                        <div className={this.state.displaySidebar ? "col-xs-0 col-sm-0 col-md-0 col-lg-0 col-xl-3 online-user-sidebar" : "col-xs-0 col-sm-0 col-md-0 col-lg-0 col-xl-1 online-user-sidebar"}>
                            <div id="online-user-sidebar" className={this.state.displaySidebar ? "visible" : "hide"}>
                                <input type="text" className="form-control media-onlineuser-searchbox" name="searchUserSidebar" value={this.state.searchUserSidebar}
                                    onChange={this.handleChange} placeholder="&#xf002; Search" />
                                <ul>
                                    {this.state.filterUsersSidebar.map((user, index) =>
                                        <li key={index}>
                                            <button type="button" className="btn btn-default" onClick={() => this.handleUserSelected(user)}>
                                                {user}
                                            </button>
                                        </li>
                                    )}
                                </ul>
                                <div id="online-usersidebar-btn">
                                    <button className="btn btn-default" type="button" onClick={this.toggleSidebar}>
                                        <i className="fas fa-bars"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={this.state.displaySidebar ? "col-xs-12 col-sm-12 col-md-6 col-lg-6 col-xl-4" : "col-xs-12 col-sm-12 col-md-12 col-lg-6 col-xl-5"}>
                            <div className="media-form-container">
                                <form className="media-form">
                                    <h2 className="media-form-header">Hello, {this.state.firstName}</h2>
                                    <button type="button" className="btn btn-default media-call-button" onClick={this.handleAudioCall} disabled={this.state.isOnCall}>
                                        <i className="fas fa-phone-alt fa-2x"></i>
                                    </button>
                                    <button type="button" className="btn btn-default media-video-button" onClick={this.handleVideoCall} disabled={this.state.isOnCall}>
                                        <i className="fas fa-video fa-2x"></i>
                                    </button>
                                    <button type="button" className="btn btn-default media-message-button">
                                        <i className="fas fa-comment-alt fa-2x"></i>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className={this.state.displaySidebar ? "col-xs-0 col-sm-0 col-md-6 col-lg-6 col-xl-5 media-img" : "col-xs-0 col-sm-0 col-md-6 col-lg-6 col-xl-6 media-img"}>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}
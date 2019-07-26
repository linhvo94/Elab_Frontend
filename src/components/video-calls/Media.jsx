import React from "react";
import io from "socket.io-client";

import { CalleeDialog } from "./CalleeDialog.jsx";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { SearchUserBox } from "./SearchUserBox.jsx";
import { sendVideoHangupEvent, sendAddOnlineUserEvent, sendVideoDeclineEvent } from '../../socket-utils/socket-utils.js';

export default class Media extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            firstName: "",
            receiver: "",
            onlineUsers: [],
            filterUsers: [],
            callDiaglogOpened: false,
            searchUserBoxOpened: false,
            searchUser: "",
            offerResponded: false,
            isAudioCall: null
        }

        this.peerConnection = null;
        this.ringTone = new Audio(ringing_tone);
        this.offerMessage = null
    }

    componentDidMount() {
        let user = JSON.parse(sessionStorage.getItem("user"));

        this.setState({ username: user.username, firstName: user.firstName });
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

                        setTimeout(() => {
                            if (this.state.offerResponded === false) {
                                sendVideoHangupEvent(this.socket, this.state.username, this.state.receiver);
                                stopRingTone(this.ringTone);
                                this.setState({ callDiaglogOpened: false });
                            }
                        }, 30000);

                        break;

                    case "video-hangup":
                    case "video-picked-up":
                        stopRingTone(this.ringTone);
                        this.setState({ callDiaglogOpened: false, offerResponded: true });
                        break;
                    case "busy-user":
                        console.log(message.message);
                        break;
                    default:
                        break;
                }

            });
        });
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
        if (e.target.value !== null && e.target.value !== "") {
            let filterUsers = this.state.onlineUsers.filter(user => user.includes(e.target.value));
            this.setState({ filterUsers: filterUsers });
        } else {
            this.setState({ filterUsers: this.state.onlineUsers });
        }
    }

    makeACall = (e, receiver) => {
        e.preventDefault();
        console.log("making a call to......", receiver);
        this.setState({ searchUserBoxOpened: false });
        var videoCallWindow = window.open("/videocall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576, top=30");
        videoCallWindow.sender = this.state.username;
        videoCallWindow.receiver = receiver;
        videoCallWindow.userType = "caller";
        videoCallWindow.isAudioCall = this.state.isAudioCall;
    }

    handleVideoCall = (e) => {
        e.preventDefault();
        this.setState({ searchUserBoxOpened: true, isAudioCall: false });
    }

    handleAudioCall = (e) => {
        e.preventDefault();
        this.setState({ searchUserBoxOpened: true, isAudioCall: true });
    }


    handleVideoCallCancel = (e) => {
        e.preventDefault();
        console.log("handle video call button clicked");
        this.setState({ searchUserBoxOpened: false });
    }

    handleCallDecline = (e) => {
        e.preventDefault();
        this.ringTone.pause();
        this.ringTone.currentTime = 0;
        this.setState({ callDiaglogOpened: false, offerResponded: true });
        console.log("this")
        sendVideoDeclineEvent(this.socket, this.state.username, this.state.receiver, this.offerMessage.socketOrigin);
    }

    handleCallAccept = (e) => {
        e.preventDefault();

        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false, offerResponded: true });

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
        this.setState({ searchUserBoxOpened: false });
    }



    render() {
        return (
            <React.Fragment>
                <div className="media-page h-100">
                    <SearchUserBox
                        searchUserBoxOpened={this.state.searchUserBoxOpened}
                        handleCloseSearchUserBox={this.handleCloseSearchUserBox}
                        makeACall={this.makeACall}
                        filterUsers={this.state.filterUsers}
                        handleChange={this.handleChange}
                        searchUser={this.state.searchUser} />

                    <CalleeDialog
                        callDiaglogOpened={this.state.callDiaglogOpened}
                        caller={this.state.receiver}
                        handleCallAccept={this.handleCallAccept}
                        handleCloseCallDiaglog={this.handleCloseCallDiaglog}
                        handleCallDecline={this.handleCallDecline} />

                    <div className="row h-100">
                        <div className="col-xs-0 col-sm-0 col-md-0 col-lg-0 col-xl-3 h-100 media-onlineuser-container">
                            <form className="media-onlineuser-form mt-10 mr-5">
                                <input type="text" className="form-control media-onlineuser-searchbox" name="searchUser" value={this.state.searchUser}
                                    onChange={this.handleChange} placeholder="&#xf002; Search" />
                                <div className="media-onlineuser-group m-10">
                                    {this.state.filterUsers.map((user, index) =>
                                        <div key={index}>
                                            <div className="media-onlineuser-li">
                                                <label className="mt-1 media-username-li">{user}</label>
                                                <button type="button" className="btn btn-default media-call-button-li" onClick={this.handleAudioCall}>
                                                    <i className="fas fa-phone-alt"></i>
                                                </button>
                                                <button type="button" className="btn btn-default media-video-button-li" onClick={this.handleVideoCall}>
                                                    <i className="fas fa-video"></i>
                                                </button>
                                            </div>
                                            <hr />
                                        </div>
                                    )}

                                </div>
                            </form>
                        </div>

                        <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6 col-xl-3 h-100">
                            <div className="media-form-container">
                                <form className="media-form">
                                    <h2 className="media-form-header">Hello, {this.state.firstName}</h2>
                                    <button type="button" className="btn btn-default media-call-button" onClick={this.handleAudioCall}>
                                        <i className="fas fa-phone-alt fa-2x"></i>
                                    </button>
                                    <button type="button" className="btn btn-default media-video-button" onClick={this.handleVideoCall}>
                                        <i className="fas fa-video fa-2x"></i>
                                    </button>
                                    <button type="button" className="btn btn-default media-message-button">
                                        <i className="fas fa-comment-alt fa-2x"></i>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="col-xs-0 col-sm-0 col-md-6 col-lg-6 col-xl-5 h-100 media-img">
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}
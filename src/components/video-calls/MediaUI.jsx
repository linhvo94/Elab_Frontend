import React from "react";
import { Link } from "react-router-dom";
import io from "socket.io-client";

import Sidebar from "./Sidebar.jsx";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { CalleeDialog } from "./CalleeDialog.jsx";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { SearchUserBox } from "./SearchUserBox.jsx";
import { UserDialog } from "./UserDialog.jsx";
import { sendVideoHangupEvent, sendAddOnlineUserEvent, sendVideoDeclineEvent } from '../../socket-utils/socket-utils.js';

export default class MediaUI extends React.Component {
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
            isOnCall: false

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

    showAllUsers = (e) => {
        e.preventDefault();
        this.setState({ filterUsers: this.state.onlineUsers });
    }

    showOnlineUsers = (e) => {
        e.preventDefault();
        this.setState({ filterUsers: this.state.onlineUsers });
    }

    render() {
        return (
            <React.Fragment>
                <UserDialog userDiaglogOpened={this.state.userDiaglogOpened}
                    userSelected={this.state.userSelected}
                    handleCloseUserDialog={this.handleCloseUserDialog}
                    handleAudioCall={this.handleAudioCall}
                    handleVideoCall={this.handleVideoCall}
                    handleUserSelectedCall={this.handleUserSelectedCall} />

                <CalleeDialog
                    callDiaglogOpened={this.state.callDiaglogOpened}
                    calleeMessage={this.offerMessage === null ? null : this.offerMessage.isAudioCall ? `${this.state.receiver} is calling you` : `${this.state.receiver} is video calling you`}
                    handleCallAccept={this.handleCallAccept}
                    handleCloseCallDiaglog={this.handleCloseCallDiaglog}
                    handleCallDecline={this.handleCallDecline} />

                <div className="media-page-container">
                    <div className="row">
                        <div className="col-md-1 col-lg-1 media-sidebar">
                            <Sidebar />
                        </div>

                        <div className="col-md-3 col-lg-3 media-conversation-list-container">
                            <div className="user clearfix">
                                <img className="user-avatar" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01.jpg" alt="avatar" />
                                <div className="about">
                                    <div className="name">{this.state.firstName} {this.state.lastName}</div>
                                    <div className="status">
                                        <i className="fa fa-circle online"></i> online
                                        </div>
                                </div>
                            </div>

                            <div className="tab">
                                <button className="tablinks" onClick={this.showAllUsers}>All</button>
                                <button className="tablinks" onClick={this.showOnlineUsers}>Online Users</button>
                            </div>

                            <div className="people-list clearfix" id="people-list">
                                <div className="search">
                                    <input type="text" placeholder="Search..." />
                                </div>
                                <ul className="list">
                                    {this.state.filterUsers.map((user, index) =>
                                        <li key={index} className="clearfix">
                                            <Link to={`/media/${user}`}>
                                                <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01.jpg" alt="avatar" />
                                                <div className="about">
                                                    <div className="name">{user}</div>
                                                    <div className="status">
                                                        <i className="fa fa-circle online"></i> online
                                                </div>
                                                </div>
                                            </Link>

                                        </li>
                                    )}

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Vincent Porter</div>
                                            <div className="status">
                                                <i className="fa fa-circle online"></i> online
                                        </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_02.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Aiden Chavez</div>
                                            <div className="status">
                                                <i className="fa fa-circle offline"></i> left 7 mins ago
                                        </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_03.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Mike Thomas</div>
                                            <div className="status">
                                                <i className="fa fa-circle online"></i> online
                                    </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_04.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Erica Hughes</div>
                                            <div className="status">
                                                <i className="fa fa-circle online"></i> online
                                        </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_05.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Ginger Johnston</div>
                                            <div className="status">
                                                <i className="fa fa-circle online"></i> online
                                        </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_06.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Tracy Carpenter</div>
                                            <div className="status">
                                                <i className="fa fa-circle offline"></i> left 30 mins ago
                                        </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_07.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Christian Kelly</div>
                                            <div className="status">
                                                <i className="fa fa-circle offline"></i> left 10 hours ago
                                        </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_08.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Monica Ward</div>
                                            <div className="status">
                                                <i className="fa fa-circle online"></i> online
                                        </div>
                                        </div>
                                    </li>

                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_09.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Dean Henry</div>
                                            <div className="status">
                                                <i className="fa fa-circle offline"></i> offline since Oct 28
                                        </div>
                                        </div>
                                    </li>
                                    <li className="clearfix">
                                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_09.jpg" alt="avatar" />
                                        <div className="about">
                                            <div className="name">Dean Henry</div>
                                            <div className="status">
                                                <i className="fa fa-circle offline"></i> offline since Oct 28
                                        </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="col-md-8 col-lg-8 media-chat-container">
                            <div className="chat">
                                <div className="chat-header clearfix">
                                    <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01_green.jpg" alt="avatar" />

                                    <div className="chat-about">
                                        <div className="chat-with">Vincent Porter</div>
                                    </div>

                                    <div className="chat-call">
                                        <Link><i className="fas fa-phone-alt"></i></Link>
                                        <Link><i className="fas fa-video"></i></Link>
                                    </div>
                                </div>

                                <div className="chat-history">
                                    <ul>
                                        <li className="clearfix">
                                            <div className="message-data align-right">
                                                <span className="message-data-time" >10:10 AM, Today</span> &nbsp; &nbsp;
                                            <span className="message-data-name" >Olia</span> <i class="fa fa-circle me"></i>

                                            </div>
                                            <div className="message other-message float-right">
                                                Hi Vincent, how are you? How is the project coming along?
                                        </div>
                                        </li>

                                        <li>
                                            <div className="message-data">
                                                <span className="message-data-name"><i className="fa fa-circle online"></i> Vincent</span>
                                                <span className="message-data-time">10:12 AM, Today</span>
                                            </div>
                                            <div className="message my-message">
                                                Are we meeting today? Project has been already finished and I have results to show you.
                                        </div>
                                        </li>

                                        <li className="clearfix">
                                            <div className="message-data align-right">
                                                <span className="message-data-time" >10:14 AM, Today</span> &nbsp; &nbsp;
                                        <span className="message-data-name" >Olia</span> <i className="fa fa-circle me"></i>

                                            </div>
                                            <div className="message other-message float-right">
                                                Well I am not sure. The rest of the team is not here yet. Maybe in an hour or so? Have you faced any problems at the last phase of the project?
                                        </div>
                                        </li>

                                        <li>
                                            <div className="message-data">
                                                <span className="message-data-name"><i className="fa fa-circle online"></i> Vincent</span>
                                                <span className="message-data-time">10:20 AM, Today</span>
                                            </div>
                                            <div className="message my-message">
                                                Actually everything was fine. I'm very excited to show this to our team.
                                        </div>
                                        </li>

                                        <li>
                                            <div className="message-data">
                                                <span className="message-data-name"><i class="fa fa-circle online"></i> Vincent</span>
                                                <span className="message-data-time">10:31 AM, Today</span>
                                            </div>
                                            <i className="fa fa-circle online"></i>
                                            <i className="fa fa-circle online"></i>
                                            <i className="fa fa-circle online"></i>
                                        </li>

                                    </ul>

                                </div>

                                <div className="chat-message clearfix">
                                    <textarea className="message-to-send" id="message-to-send" placeholder="Type your message" rows="1"></textarea>
                                    <button>Send</button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>

        )
    }
}
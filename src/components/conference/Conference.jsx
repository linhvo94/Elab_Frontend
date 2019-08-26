import React from "react";
import io from "socket.io-client";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { sendConferenceDeclineEvent, sendConferencePickedUpEvent } from "../../utils/socket-utils/socket-utils";
import ConferenceForm from "./ConferenceForm";
import { CalleeDialog } from "../video-calls/CalleeDialog";

export default class Conference extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sender: {},
            receiver: {},

            searchUser: "",
            callDiaglogOpened: false,

            usersFromDB: [],
            onlineUsers: [],
            filterUsers: [],
            onlineUsersFromSocket: [],
            conferenceUsers: {},

            isOnCall: false,

            socket: null
        }

        this.offerMessage = null;
        this.ringTone = new Audio(ringing_tone);
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


    handleOnlineUsers = (usersFromDB, onlineUsersFromSocket) => {
        let actualOnlineUsers = [];
        if (onlineUsersFromSocket.length > 0) {
            onlineUsersFromSocket.forEach(userSocket => {
                let onlineUser = usersFromDB.find(userDB => userDB.username === userSocket && userDB.username !== this.state.sender.username);
                if (onlineUser !== undefined && onlineUser !== null
                    && onlineUser.username !== this.state.sender.username && actualOnlineUsers.indexOf(onlineUser) === -1) {
                    actualOnlineUsers.push(onlineUser);
                }
            });
        }

        console.log(actualOnlineUsers, "actualOnlineUsers");

        this.setState({ onlineUsers: actualOnlineUsers });

        if (this.state.searchUser === "") {
            if (Object.keys(this.state.conferenceUsers).length > 0) {
                let uniqueOnlineUsers = this.getUniqueOnlineUsers(actualOnlineUsers);
                this.setState({ filterUsers: uniqueOnlineUsers });
            } else {
                this.setState({ filterUsers: actualOnlineUsers });
            }
        }
    }

    getUniqueOnlineUsers = (onlineUsers) => {
        let uniqueOnlineUsers = [];
        onlineUsers.forEach(onlineUser => {
            if (onlineUser.username !== this.state.sender.username) {
                if (this.state.conferenceUsers[onlineUser.username] === undefined || this.state.conferenceUsers[onlineUser.username] === null) {
                    uniqueOnlineUsers.push(onlineUser);
                }
            }
        });
        return uniqueOnlineUsers;
    }


    handleSocketEvent = (socket) => {
        socket.on("connect", () => {
            socket.on("conference", (message) => {
                console.log("conference message: ", message);

                switch (message.type) {
                    case "conference-offer":
                        this.offerMessage = message;
                        playRingTone(this.ringTone);
                        let receiver = this.state.usersFromDB.find(user => user.username === message.sender);
                        this.setState({ receiver: receiver, callDiaglogOpened: true });
                        break;

                    case "conference-hangup":
                        stopRingTone(this.ringTone);
                        this.setState({ callDiaglogOpened: false, isOnCall: false })
                        break;

                    case "conference-picked-up":
                        stopRingTone(this.ringTone);
                        this.setState({ callDiaglogOpened: false, isOnCall: true });
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
                let filterUsers = this.state.onlineUsers.filter(user => this.state.conferenceUsers[user.username] === undefined || this.state.conferenceUsers[user.username] === null);
                let searchUsers = filterUsers.filter(user => {
                    let userName = `${user.firstName} ${user.lastName}`;
                    return (userName.toLowerCase()).includes((e.target.value).toLowerCase())
                });

                this.setState({ filterUsers: searchUsers });
            } else {
                let uniqueOnlineUsers = this.getUniqueOnlineUsers(this.state.onlineUsers);
                this.setState({ filterUsers: uniqueOnlineUsers });
            }
        }
    }

    handleAddUserToConference = (e, user) => {
        e.preventDefault();
        let { conferenceUsers } = this.state;
        let userKeys = Object.keys(conferenceUsers);
        if (userKeys.length < 5) {
            conferenceUsers[user.username] = user;
            let filterUsers = [];
            this.state.onlineUsers.forEach(onlineUser => {
                if ((onlineUser.username !== this.state.sender.username)
                    && (conferenceUsers[onlineUser.username] === undefined || conferenceUsers[onlineUser.username] === null)) {
                    filterUsers.push(onlineUser);
                }
            });
            this.setState({ conferenceUsers, filterUsers });
        } else {
            alert("You have reached the maximum number of participant in a conference.");
        }
    }


    handleRemoveUserFromConference = (e, username) => {
        e.preventDefault();
        let { conferenceUsers, onlineUsers } = this.state;
        delete conferenceUsers[username];
        let filterUsers = [];
        onlineUsers.forEach(onlineUser => {
            if ((onlineUser.username !== this.state.sender.username)
                && (conferenceUsers[onlineUser.username] === undefined || conferenceUsers[onlineUser.username] === null)) {
                filterUsers.push(onlineUser);
            }
        });
        this.setState({ filterUsers, conferenceUsers });
    }

    handleCall = (e) => {
        e.preventDefault();
        if (Object.keys(this.state.conferenceUsers).length > 0) {
            this.setState({ isOnCall: true });
            console.log("making a call to......", this.state.conferenceUsers);
            var videoCallWindow = window.open("/conferencecall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576, top=30");
            videoCallWindow.sender = this.state.sender.username;
            videoCallWindow.receiver = this.state.conferenceUsers;
            videoCallWindow.userType = "caller";
        } else {
            alert("Conference must have at least two participants.");
        }
    }

    handleCallAccept = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        sendConferencePickedUpEvent(this.state.socket, this.state.sender.username, this.state.sender.username);
        this.setState({ callDiaglogOpened: false, isOnCall: true });

        var videoCallWindow = window.open("/conferencecall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576");
        videoCallWindow.sender = this.state.sender.username;
        videoCallWindow.receiver = this.state.receiver;
        videoCallWindow.offerMessage = this.offerMessage;
        videoCallWindow.userType = "callee";
    }

    handleCloseCallDiaglog = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false });
    }

    handleCallDecline = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        this.setState({ callDiaglogOpened: false });
        sendConferenceDeclineEvent(this.state.socket, this.state.sender.username, this.state.receiver.username, this.offerMessage.socketOrigin);
    }

    render() {
        return (
            <React.Fragment>
                <CalleeDialog
                    callDiaglogOpened={this.state.callDiaglogOpened}
                    calleeMessage={this.offerMessage === null && Object.keys(this.state.receiver).length === 0 ? null : `${this.state.receiver.firstName} ${this.state.receiver.lastName} is requesting a video conference...`}
                    handleCallAccept={this.handleCallAccept}
                    handleCloseCallDiaglog={this.handleCloseCallDiaglog}
                    handleCallDecline={this.handleCallDecline} />

                <div className="media-page-container">
                    <div className="media-conversation-list-container">
                        <div className="user clearfix">
                            <div className="user-avatar">
                                {Object.keys(this.state.sender).length === 0 || this.state.sender.firstName === null ?
                                    "..." : this.state.sender.firstName[0]}
                            </div>
                            <div className="about">
                                <div className="name">
                                    {Object.keys(this.state.sender).length === 0 ? "..."
                                        : this.state.sender.firstName !== null && this.state.sender.lastName !== null ?
                                            `${this.state.sender.firstName} ${this.state.sender.lastName}` : this.state.sender.username}
                                </div>

                                <div className="status">
                                    <i className="fa fa-circle online"></i> online
                                </div>
                            </div>
                        </div>

                        <div className="people-list clearfix" id="people-list">
                            <div className="search">
                                <input className="form-control" type="text" onChange={this.handleChange}
                                    name="searchUser" value={this.state.searchUser} placeholder="Search..." />
                            </div>
                            <ul className="list conference-list">
                                {this.state.filterUsers.length > 0 ?
                                    this.state.filterUsers.map((user, index) =>
                                        <li key={index} className="clearfix">
                                            <div className="user-avatar">{user.firstName !== null ? user.firstName[0] : user.username[0]}</div>
                                            <div className="about">
                                                <div className="name">{user.firstName !== null && user.lastName !== null ?
                                                    `${user.firstName} ${user.lastName}` : user.username}</div>
                                                <div className="status">
                                                    <i className="fa fa-circle online"></i> online
                                                </div>
                                            </div>
                                            <button onClick={(e) => this.handleAddUserToConference(e, user)}><i className="fas fa-plus"></i></button>
                                        </li>
                                    ) : null
                                }
                            </ul>
                        </div>
                    </div>
                    <div className="conference-form-container">
                        <ConferenceForm
                            handleRemoveUserFromConference={this.handleRemoveUserFromConference}
                            conferenceUsers={this.state.conferenceUsers}
                            handleCall={this.handleCall}
                            isOnCall={this.state.isOnCall} />
                    </div>
                </div>

            </React.Fragment>

        )
    }
}
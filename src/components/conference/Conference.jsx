import React from "react";
import io from "socket.io-client";
import ringing_tone from "../../media/sounds/ringing_tone.wav";
import { playRingTone, stopRingTone } from "../../media/sounds/sound-control.js";
import { sendAddOnlineUserEvent, sendConferenceDeclineEvent, sendConferencePickedUpEvent } from "../../utils/socket-utils/socket-utils";
import ConferenceForm from "./ConferenceForm";
import { CalleeDialog } from "../video-calls/CalleeDialog";

export default class Conference extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            senderID: null,
            username: "",
            firstName: "",
            lastName: "",
            receiver: "",

            searchUser: "",
            callDiaglogOpened: false,

            onlineUsers: [],
            filterUsers: [],
            conferenceUsers: [],
            isOnCall: false
        }

        this.socket = null;
        this.offerMessage = null;
        this.ringTone = new Audio(ringing_tone);
    }

    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));
        this.setState({ username: user.username, firstName: user.firstName, lastName: user.lastName });
        this.socket = io("http://localhost:9000");
        // this.socket = io("https://www.e-lab.live:9000");

        this.socket.on("connect", () => {
            console.log("conference open connection");
            sendAddOnlineUserEvent(this.socket, user.username);

            this.socket.on("online_users", (message) => {
                console.log(message);
                let onlineUsers = message.filter(m => m !== this.state.username);
                this.setState({ onlineUsers: onlineUsers });
                let filterUsers = onlineUsers.filter(user => !this.state.conferenceUsers.includes(user));

                if (this.state.searchUser === "") {
                    this.setState({ filterUsers: filterUsers });
                }

            });

            this.socket.on("conference", (message) => {
                console.log("conference message: ", message);

                switch (message.type) {
                    case "conference-offer":
                        this.offerMessage = message;
                        playRingTone(this.ringTone);
                        this.offerMessage = message;
                        this.setState({ receiver: message.sender, callDiaglogOpened: true });
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

    livestreamPrepare = () => {
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null) {
            if (user.id !== undefined && user.id !== null) {
                this.setState({ senderID: user.id });
            }

            if (user.firstName !== undefined && user.firstName !== null) {
                this.setState({ firstName: user.firstName });
            }

            if (user.lastName !== undefined && user.lastName !== null) {
                this.setState({ lastName: user.lastName });
            }
        }
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
        if (e.target.name === "searchUser") {
            let filterUsers = this.state.onlineUsers.filter(user => !this.state.conferenceUsers.includes(user));
            if (e.target.value !== null && e.target.value !== "") {
                filterUsers = filterUsers.filter(user => (user.toLowerCase()).includes((e.target.value).toLowerCase()));
                this.state.conferenceUsers.forEach(conferenceUser => {
                    let indexUser = filterUsers.indexOf(conferenceUser);
                    if (indexUser !== -1) {
                        filterUsers.splice(indexUser, 1);
                    }
                });
                this.setState({ filterUsers });
            } else {
                this.setState({ filterUsers });
            }
        }
    }

    handleAddUserToConference = (e, username) => {
        if (this.state.conferenceUsers.length < 5) {
            e.preventDefault();
            let conferenceUsers = this.state.conferenceUsers;
            conferenceUsers.push(username);
            let filterUsers = this.state.filterUsers.filter(user => !conferenceUsers.includes(user));
            this.setState({ conferenceUsers, filterUsers });
        } else {
            alert("You have reached the maximum number of participant in a conference.");
        }
    }


    handleRemoveUserFromConference = (e, username) => {
        e.preventDefault();
        let { filterUsers, conferenceUsers } = this.state;
        let updatedConferenceUsers = conferenceUsers.filter(user => user !== username);
        filterUsers.push(username);
        this.setState({ filterUsers, conferenceUsers: updatedConferenceUsers });
    }

    handleCall = (e) => {
        e.preventDefault();
        if (this.state.conferenceUsers.length > 0) {
            this.setState({ isOnCall: true });
            console.log("making a call to......", this.state.conferenceUsers);
            var videoCallWindow = window.open("/conferencecall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576, top=30");
            videoCallWindow.sender = this.state.username;
            videoCallWindow.receiver = this.state.conferenceUsers;
            videoCallWindow.userType = "caller";
        } else {
            alert("Conference must have at least two participants.");
        }
    }

    handleCallAccept = (e) => {
        e.preventDefault();
        stopRingTone(this.ringTone);
        // sendConferencePickedUpEvent(this.socket, this.state.username, this.state.username);
        this.setState({ callDiaglogOpened: false, isOnCall: true });

        var videoCallWindow = window.open("/conferencecall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576");
        videoCallWindow.sender = this.state.username;
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
        sendConferenceDeclineEvent(this.socket, this.state.username, this.state.receiver, this.offerMessage.socketOrigin);
    }

    render() {
        return (
            <React.Fragment>
                <CalleeDialog
                    callDiaglogOpened={this.state.callDiaglogOpened}
                    calleeMessage={this.offerMessage === null ? null : `${this.state.receiver} is requesting a video conference...`}
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
                                <input className="form-control" type="text" onChange={this.handleChange}
                                    name="searchUser" value={this.state.searchUser} placeholder="Search a username..." />
                            </div>
                            <ul className="list conference-list">
                                {this.state.filterUsers.map((user, index) =>
                                    <li key={index} className="clearfix">
                                        <div className="user-avatar">{user[0]}</div>
                                        <div className="about">
                                            <div className="name">{user}</div>
                                            <div className="status">
                                                <i className="fa fa-circle online"></i> online
                                                    </div>
                                        </div>
                                        <button onClick={(e) => this.handleAddUserToConference(e, user)}><i className="fas fa-plus"></i></button>
                                    </li>
                                )}
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

            </React.Fragment >

        )
    }
}
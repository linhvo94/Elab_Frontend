import React from "react";

import { SIGNALING_SERVER_URL } from "../../api-urls/signaling-api.js";
import io from "socket.io-client";

export default class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            message: "",
            receiver: "",
            groupname: ""
        }
        this.socket = null;
        this.peerConnection = null;
    }

    componentDidMount() {
        this.socket = io(SIGNALING_SERVER_URL);
        this.socket.on("connect", () => {
            this.socket.on("private-message", (message) => {
                console.log(message);
            });

            this.socket.on("group-chat", (message) => {
                console.log(message);
            });
        });
    }

    handleChange = (e) => {
        e.preventDefault();
        this.setState({ [e.target.name]: e.target.value });
    }

    handleUser = (e) => {
        e.preventDefault();
        let data = {
            username: this.state.username
        }
        this.socket.emit("private-chat", data);

    }

    sendMessage = (e) => {
        e.preventDefault();
        let data = {
            username: this.state.username,
            message: this.state.message,
            receiver: this.state.receiver
        }
        this.socket.emit("private-message", data);
    }

    broadcastMessage = (e) => {
        e.preventDefault();
        let data = {
            username: this.state.username,
            room: this.state.groupname
        }; 
        this.socket.emit("join", data); 
    }

    sendMessageToGroup = (e) => {
        e.preventDefault();
        let data = {
            username: this.state.username,
            room: this.state.groupname,
            message: this.state.message,
        };

        this.socket.emit("group-chat", data); 
    }

    render() {
        return (
            <React.Fragment>


                <div className="mt-10">
                    Your username : <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                    Your friend : <input type="text" name="receiver" value={this.state.receiver} onChange={this.handleChange} />
                    <button type="button" className="btn btn-success" onClick={this.handleUser}>

                        Enter

                        </button>
                </div>



                <div className="panel panel-default">
                    <div className="panel-heading">Chat Window</div>
                    <div className="panel-body">

                    </div>
                    <form action="">
                        <textarea className="form-control" name="message" value={this.state.message}
                            onChange={this.handleChange} cols="30" rows="10">

                        </textarea>



                    </form>
                    <button type="button" className="btn btn-success" onClick={this.sendMessage}>
                        Send
                        </button>

                </div>


                <input type="text" className="form-control" name="groupname" value={this.state.groupname}
                    onChange={this.handleChange} />

                <button type="button" className="btn btn-success" onClick={this.broadcastMessage}>
                    Broadcast
                        </button>

                        <button type="button" className="btn btn-danger" onClick={this.sendMessageToGroup}>
                    Send to Group
                        </button>



            </React.Fragment>
        )
    }
}

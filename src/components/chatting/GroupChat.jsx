import React from "react";
import { iceServerConfig } from '../../servers-config/ice-server-config.js';
import { SIGNALING_SERVER_URL } from "../../api-urls/signaling-api.js";
import io from "socket.io-client";
import uuid from "uuid/v4";

export default class GroupChat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            receiver: "",
            message: "",
            room: "",
            messagesToDisplay: []
        }

        this.socket = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.room = "";
    }

    componentDidMount() {
        let user = JSON.parse(sessionStorage.getItem("user"));
        this.setState({ username: user.username });
        this.socket = io(SIGNALING_SERVER_URL);

        this.socket.on("connect", () => {
            this.socket.emit("add_online_user", {
                username: user.username
            });

            this.socket.on("group_messages", (message) => {
                this.setState({receiver: message.sender, room: message.room});
                this.room = message.room;
                switch (message.type) {
                    case "message-offer":
                        this.handleMessageOffer(message);
                        break;
                    case "message-answer":
                        this.handleMessageAnswer(message);
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
    }

    createLocalPeerConnection = () => {
        this.peerConnection = new RTCPeerConnection(iceServerConfig);
        this.dataChannel = this.peerConnection.createDataChannel("message-channel");
        this.peerConnection.onicecandidate = this.handleIceCandidate;
        this.peerConnection.onnegotiationneeded = this.handleNegotiationNeeded;

        this.dataChannel.onopen = () => console.log(this.dataChannel.readyState);
        this.dataChannel.onmessage = this.handleMessage;
        // (event) => console.log(this.state.username, event.data);

        // this.peerConnection.ondatachannel = this.handleDataChannel;

    }

    handleIceCandidate = (event) => {
        if (event.candidate) {
            this.socket.emit("message_exchange", {
                type: "new-ice-candidate",
                sender: this.state.username,
                receiver: this.state.receiver,
                room: this.room,
                candidate: event.candidate
            })
        }
    }

    handleNegotiationNeeded = () => {
        this.peerConnection.createOffer()
            .then(this.onCreateOfferSuccess)
            .catch(e => console.log(e));
    }

    onCreateOfferSuccess = (offerSDP) => {
        console.log("create offer success");
        this.peerConnection.setLocalDescription(offerSDP)
            .then(() => {
                console.log("set local offer successfully")
                this.socket.emit("message_offer", {
                    type: "message-offer",
                    sender: this.state.username,
                    receivers: [].concat(this.state.receiver),
                    room: uuid(),
                    sdp: offerSDP
                })
            })
            .catch(e => console.log(e));
    }

    handleMessage = (event) => {
        // console.log("event", event.data);
        let { messagesToDisplay, receiver } = this.state;
        // // messagesToDisplay.push(event.data);
        console.log(this.state.username, event.data);
        messagesToDisplay.push(`${receiver}: ${event.data}\n`);
        this.setState({ messagesToDisplay: messagesToDisplay });
    }

    handleSendMessage = (e) => {
        e.preventDefault();
        this.dataChannel.send(this.state.message);

        let { messagesToDisplay, username, message } = this.state;
        // // messagesToDisplay.push(event.data);
        messagesToDisplay.push(`${username}: ${message}\n`);
        this.setState({ messagesToDisplay: messagesToDisplay });
    }

    handleMessageOffer = (message) => {
        console.log("message back", message);
        this.peerConnection = new RTCPeerConnection(iceServerConfig);
        this.peerConnection.onicecandidate = this.handleIceCandidate;
        this.peerConnection.ondatachannel = this.receiveChannelCallback;

        let remoteSDP = new RTCSessionDescription(message.sdp);
        this.peerConnection.setRemoteDescription(remoteSDP)
            .then(() => this.peerConnection.createAnswer())
            .then(this.onCreateAnswerSuccess)
            .catch(e => console.log(e));
    }

    receiveChannelCallback = (event) => {
        this.dataChannel = event.channel;
        console.log("on message data channel");
        this.dataChannel.onmessage = this.handleMessage
        // (event) => console.log("event.data", event.data);
    }

    onCreateAnswerSuccess = (answerSDP) => {
        this.peerConnection.setLocalDescription(answerSDP)
            .then(() => this.socket.emit("message_exchange", {
                type: "message-answer",
                sender: this.state.username,
                receiver: this.state.receiver,
                room: this.room,
                sdp: answerSDP
            }))
            .catch(e => console.log(e));

    }


    handleMessageAnswer = (message) => {
        let remoteSDP = new RTCSessionDescription(message.sdp);
        this.peerConnection.setRemoteDescription(remoteSDP);
    }

    handleNewIceCandidate = (message) => {
        let candidate = new RTCIceCandidate(message.candidate);
        this.peerConnection.addIceCandidate(candidate).catch(e => console.log(e));
    }

    handleDataChannel = (event) => {
        this.dataChannel = event.channel;
        this.dataChannel.onmessage = this.handleMessage;

        // (event) => {
        //     console.log(event.data);
        // }
    }


    connectWithFriend = (e) => {
        e.preventDefault();
        this.createLocalPeerConnection();

    }

    render() {
        return (
            <React.Fragment>
                <div className="card bg-dark text-white group-chat-card">
                    <div className="card-header">Chat chat is fun</div>
                    <div className="card-body">
                        {this.state.messagesToDisplay.map(m => m + "\n")}
                    </div>
                    <form>
                        <div className="form-group">
                            Enter your friend username:
                        <input className="form-control" type="text" name="receiver" value={this.state.receiver}
                                onChange={this.handleChange} />
                        </div>

                        <button type="button" className="btn btn-sucess" onClick={this.connectWithFriend}>Send Message Request</button>

                        <div className="form-group">
                            Your message:
                            <textarea className="form-control" name="message" value={this.state.message}
                                onChange={this.handleChange} cols="10" rows="2"></textarea>
                        </div>

                        <button type="button" className="btn btn-sucess" onClick={this.handleSendMessage}>Send Message</button>
                    </form>

                </div>

            </React.Fragment >
        )
    }
}
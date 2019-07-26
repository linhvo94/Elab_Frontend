// import React from "react";
// import { iceServerConfig } from '../../servers-config/ice-server-config.js';
// import { SIGNALING_SERVER_URL } from "../../api-urls/signaling-api.js";
// import io from "socket.io-client";
// import uuid from "uuid/v4";

// export default class GroupChat extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             username: "",
//             receivers: [],
//             message: "",
//             room: "",
//             messagesToDisplay: [],
//             receiverA: "",
//             receiverB: ""
//         }
//         this.socket = null;
//         this.localPeerConnection = {};
//         this.remotePeerConnection = {};
//         this.dataChannel = {};
//         this.sender = null
//         this.otherPeers = [];
//         this.receivedChannel = {};

//     }

//     componentDidMount() {
//         let user = JSON.parse(sessionStorage.getItem("user"));
//         this.setState({ username: user.username });

//         this.socket = io(SIGNALING_SERVER_URL);
//         this.socket.on("connect", () => {
//             console.log("connected", user.username);
//             this.socket.emit("add_online_user", user.username);

//             this.socket.on("new_message_offer", (message) => {
//                 console.log("hello new offer");
//                 this.handleMessageOffer(message);
//             });

//             this.socket.on("new_message_answer", (message) => {
//                 console.log("hello new answer");
//                 this.handleMessageAnswer(message);
//             });

//             this.socket.on("new_ice_candidate", (message) => {
//                 console.log("hello new candidate");
//                 this.handleNewIceCandidate(message);
//             });
//         });
//     }

//     createPeerConnection = () => {
//         let receivers = [this.state.receiverA, this.state.receiverB];
//         if (receivers.length > 0) {
//             receivers.forEach(r => {
//                 this.localPeerConnection[r] = new RTCPeerConnection(iceServerConfig);
//                 this.localPeerConnection[r].onnegotiationneeded = () => this.handleNegotiation(r);
//                 this.localPeerConnection[r].onicecandidate = (event) => this.handleIceCandidate(event, r);
//                 // this.dataChannel[r] = this.localPeerConnection[r].createDataChannel(`${r}_channel`);
//                 this.dataChannel[r] = this.localPeerConnection[r].createDataChannel(`message_channel`);
//                 this.dataChannel[r].onopen = () => console.log(this.dataChannel[r].readyState);
//                 this.dataChannel[r].onmessage = (event) => this.handleDataChannel(event, r);
//             });
//         }

//     }

//     handleNegotiation = (receiver) => {
//         console.log("local Peer create offer", receiver)
//         this.localPeerConnection[receiver].createOffer()
//             .then((offerSDP) => this.onCreateOfferSuccess(offerSDP, receiver));
//     }

//     handleIceCandidate = (event, receiver) => {
//         if (event.candidate) {
//             this.socket.emit("ice_candidate", {
//                 type: "new-ice-candidate",
//                 sender: this.state.username,
//                 receiver: receiver,
//                 candidate: event.candidate
//             });
//         }

//     }

//     onCreateOfferSuccess = (offerSDP, receiver) => {
//         console.log("create offer success with ", receiver);
//         this.localPeerConnection[receiver].setLocalDescription(offerSDP)
//             .then(() => {
//                 let otherPeers = this.state.receivers.filter(r => r !== receiver);
//                 this.socket.emit("message_offer", {
//                     type: "message-offer",
//                     sender: this.state.username,
//                     receiver: receiver,
//                     sdp: offerSDP,
//                     otherPeers: otherPeers
//                 });
//             })
//             .catch(e => console.log(e));
//     }

//     connectWithFriend = () => {
//         let room = uuid();
//         let receivers = [this.state.receiverA, this.state.receiverB];
//         this.setState({ receivers: receivers, room: room });
//         this.createPeerConnection();
//     }

//     handleMessageOffer = (message) => {
//         console.log("handle message offer by ", message.sender);
//         let sender = message.sender;
//         let otherPeers = message.otherPeers;

//         this.localPeerConnection[sender] = new RTCPeerConnection(iceServerConfig);
//         // this.localPeerConnection[sender].onnegotiationneeded = () => this.handleNegotiation(sender);
//         this.localPeerConnection[sender].onicecandidate = (event) => this.handleIceCandidate(event, sender);
//         this.localPeerConnection[sender].ondatachannel = (event) => this.handleDataChannel(event, sender);
//         let remoteSDP = new RTCSessionDescription(message.sdp);
//         this.localPeerConnection[sender].setRemoteDescription(remoteSDP)
//             .then(() => this.localPeerConnection[sender].createAnswer())
//             .then((answerSDP) => this.onCreateAnswerSuccess(answerSDP, sender))
//             .catch(e => console.log(e));

//         otherPeers.forEach(p => {
//             this.localPeerConnection[p] = new RTCPeerConnection(iceServerConfig);
//             // this.dataChannel[p] = this.localPeerConnection[p].createDataChannel(`${p}_channel`);
//             this.dataChannel[p] = this.localPeerConnection[p].createDataChannel(`message_channel`);
//             this.dataChannel[p].onopen = () => console.log(this.dataChannel[p].readyState);
//             this.localPeerConnection[p].onnegotiationneeded = () => this.handleNegotiation(p);
//             this.localPeerConnection[p].onicecandidate = (event, p) => this.handleIceCandidate(event, p);
//         });

//     }

//     handleMessageAnswer = (message) => {
//         let remoteSDP = new RTCSessionDescription(message.sdp);
//         this.localPeerConnection[message.sender].setRemoteDescription(remoteSDP);
//     }

//     onCreateAnswerSuccess = (answerSDP, sender) => {
//         console.log("on create answer success");
//         this.localPeerConnection[sender].setLocalDescription(answerSDP)
//             .then(() => {
//                 this.socket.emit("message_answer", {
//                     type: "message-answer",
//                     sender: this.state.username,
//                     receiver: sender,
//                     sdp: answerSDP
//                 })
//             });
//     }

//     handleDataChannel = (event, receiver) => {
//         console.log(event.channel, "channelllllllllll")
//         this.receivedChannel[receiver] = event.channel;
//         // let { messagesToDisplay } = this.state;
//         // console.log("incoming data channel ", this.state.username, event.data);
//         // this.dataChannel[receiver] = event.channel;
//         this.receivedChannel[receiver].onmessage = this.handleIncomingMessage;
//         // messagesToDisplay.push(`${event.data}\n`);
//         // this.setState({ messagesToDisplay: messagesToDisplay });
//     }

//     handleIncomingMessage = (event) => {
//         let { messagesToDisplay } = this.state;
//         console.log("incoming data channel ", this.state.username, event.data);
//         messagesToDisplay.push(`${event.data}\n`);
//         this.setState({ messagesToDisplay: messagesToDisplay });
//     }

//     handleNewIceCandidate = (message) => {
//         let candidate = new RTCIceCandidate(message.candidate);
//         this.localPeerConnection[message.sender].addIceCandidate(candidate);
//     }

//     handleChange = (e) => {
//         this.setState({ [e.target.name]: e.target.value });
//     }

//     handleSendMessage = (e) => {
//         e.preventDefault();
//         for (let channel in this.dataChannel) {
//             console.log("channel to send", channel);
//             this.dataChannel["message_channel"].send(this.state.message);

//             let { messagesToDisplay, username, message } = this.state;
//             // // messagesToDisplay.push(event.data);
//             messagesToDisplay.push(`${username}: ${message}\n`);
//             this.setState({ messagesToDisplay: messagesToDisplay });
//         }

//     }

//     render() {
//         return (
//             <React.Fragment>
//                 <div className="card bg-dark text-white group-chat-card">
//                     <div className="card-header">Chat chat is fun</div>
//                     <div className="card-body">
//                         {this.state.messagesToDisplay.map((m, index) =>
//                             <div key={index}>{m + "\n"}</div>
//                         )}
//                     </div>
//                     <form>
//                         <div className="form-group">
//                             Enter your friend username:
//                         <input className="form-control" type="text" name="receiverA" value={this.state.receiverA}
//                                 onChange={this.handleChange} />

//                             <input className="form-control" type="text" name="receiverB" value={this.state.receiverB}
//                                 onChange={this.handleChange} />

//                         </div>

//                         <button type="button" className="btn btn-sucess" onClick={this.connectWithFriend}>Send Request</button>

//                         <div className="form-group">
//                             Your message:
//                             <textarea className="form-control" name="message" value={this.state.message}
//                                 onChange={this.handleChange} cols="10" rows="2"></textarea>
//                         </div>

//                         <button type="button" className="btn btn-sucess" onClick={this.handleSendMessage}>Send Message</button>
//                     </form>

//                 </div>

//             </React.Fragment >
//         )
//     }
// }
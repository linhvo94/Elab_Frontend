import React from "react";

// export default class NewChat extends React.Component {
//     render() {
//         return (
//             <div className="chat">
//                 <div className="chat-header clearfix">
//                     <div className="user-avatar">{this.state.receiver ? this.state.receiver[0] : `...`}</div>

//                     <div className="chat-about">
//                         <div className="chat-with">{this.state.receiver}</div>
//                     </div>

//                     <div className="chat-call">
//                         <button onClick={(e) => this.handleCall(e, true)} disabled={this.state.isOnCall}><i className="fas fa-phone-alt"></i></button>
//                         <button onClick={(e) => this.handleCall(e, false)} disabled={this.state.isOnCall}><i className="fas fa-video" disabled={this.state.isOnCall}></i></button>
//                     </div>
//                 </div>
//                 <div className="chat-history">
//                     {/* {this.state.loading ? <div className="loader"></div> :
//                         <ChatList messages={this.props.chatMessages[this.props.match.params.username]} />
//                     } */}

//                 </div>
//                 <div className="chat-message clearfix">
//                     <textarea className="form-control" id="message-to-send" placeholder="Type your message" rows="1"
//                         name="textMessage" value={this.props.textMessage} onChange={this.props.handleChange}></textarea>
//                     <button onClick={(e) => this.props.handleSendMessage(e, this.state.receiver)}>Send</button>
//                 </div>

//             </div>
//         )
//     }
// }
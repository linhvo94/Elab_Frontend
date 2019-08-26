import React from "react";
import uuid from "uuid/v4";


const ChatMessage = (props) => (
    props.message.islocalpeer ?
        <li className="my-chat-message-data">
            <p>{props.message.message}</p>
        </li>
        :
        <li className="chat-message-data">
            <p>{props.message.message}</p>
        </li>
);

class ChatList extends React.Component {
    messagesEndRef = React.createRef();

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom = () => {
        this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    render() {
        return (
            <ul>
                {this.props.messages !== undefined && this.props.messages.length > 0 ?
                    this.props.messages.map((message, index) =>
                        <ChatMessage key={index} message={message} />
                    )
                    : null}
                <div ref={this.messagesEndRef}></div>
            </ul>)
    }
}

export default class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOnCall: false,
            loading: true,
            sender: "",
            receiver: null,
            onlineUsers: []
        }

    }

    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null) {
            this.setState({ sender: user });
        }

        if (this.props.isOnCall !== undefined && this.props.isOnCall !== null) {
            this.setState({ isOnCall: this.props.isOnCall });
        }

        if (this.props.match.params.username !== undefined && this.props.match.params.username !== null) {
            let receiver = this.props.onlineUsers.find(user => this.props.match.params.username === user.username);
            this.setState({ receiver: receiver });
            this.props.createPeerConnection(this.props.match.params.username);
            this.loadData(500);
        }
    }

    componentDidUpdate(prevProps) {
        let usernameParams = this.props.match.params.username;
        let onlineUsers = this.props.onlineUsers;
        if (usernameParams !== undefined && usernameParams !== null && usernameParams !== prevProps.match.params.username) {
            this.setState({ loading: true });
            let receiver = onlineUsers.find(user => usernameParams === user.username);
            this.setState({ receiver: receiver });
            this.props.createPeerConnection(usernameParams);
            this.loadData(500);

        }

        if (onlineUsers !== undefined && onlineUsers !== null && onlineUsers !== prevProps.onlineUsers) {
            let receiver = onlineUsers.find(user => usernameParams === user.username);
            this.setState({ receiver: receiver });
            this.props.createPeerConnection(usernameParams);
        }

        if (this.props.isOnCall !== undefined && this.props.isOnCall !== null
            && this.props.isOnCall !== prevProps.isOnCall) {
            this.setState({ isOnCall: this.props.isOnCall });
        }
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleCall = (e, isAudioCall) => {
        e.preventDefault();
        console.log("making a call to......", this.state.receiver, " ", this.state.sender);
        this.setState({ isOnCall: true });
        var videoCallWindow = window.open("/videocall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576, top=30");
        videoCallWindow.sender = this.state.sender.username;
        videoCallWindow.receiver = this.state.receiver.username;
        videoCallWindow.userType = "caller";
        videoCallWindow.isAudioCall = isAudioCall;
    }

    loadData = (time) => {
        setTimeout(() => {
            this.setState({ loading: false });
        }, time);
    }

    render() {
        return (
            <div className="chat">
                <div className="chat-header clearfix">
                    <div className="user-avatar">{this.state.receiver !== undefined && this.state.receiver !== null ?
                        this.state.receiver.firstName[0] : `...`}</div>

                    <div className="chat-about">
                        <div className="chat-with">{this.state.receiver !== undefined && this.state.receiver !== null ?
                            `${this.state.receiver.firstName} ${this.state.receiver.lastName}` : null}</div>
                    </div>

                    <div className="chat-call">
                        <button onClick={(e) => this.handleCall(e, true)} disabled={this.state.isOnCall}><i className="fas fa-phone-alt"></i></button>
                        <button onClick={(e) => this.handleCall(e, false)} disabled={this.state.isOnCall}><i className="fas fa-video"></i></button>
                    </div>
                </div>
                <div className="chat-history">
                    {this.state.loading ? <div className="loader"></div> :
                        <ChatList messages={this.props.chatMessages[this.props.match.params.username]} />
                    }

                </div>
                <div className="chat-message clearfix">
                    <textarea className="form-control" id="message-to-send" placeholder="Type your message" rows="1"
                        name="textMessage" value={this.props.textMessage} onChange={this.props.handleChange}></textarea>
                    <button onClick={(e) => this.props.handleSendMessage(e, this.state.receiver.username)}>Send</button>
                </div>

            </div>
        )
    }
}
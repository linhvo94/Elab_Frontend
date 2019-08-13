import React from "react";

export default class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOnCall: false,
            loading: true,
            sender: "",
            receiver: "",
            onlineUsers: []
        }
    }

    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));
        this.setState({ sender: user.username });
        if (this.props.onlineUsers !== undefined && this.props.onlineUsers !== null) {
            this.setState({ onlineUsers: this.props.onlineUsers});
        }

        if (this.props.isOnCall !== undefined && this.props.isOnCall !== null) {
            this.setState({ isOnCall: this.props.isOnCall });
        }
        if (this.props.match.params.username !== undefined && this.props.match.params.username !== null) {
            this.setState({ receiver: this.props.match.params.username });
            this.loadData(500);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.onlineUsers !== undefined && this.props.onlineUsers !== null) {
            if (this.props.onlineUsers !== prevProps.onlineUsers) {
                this.setState({ onlineUsers: this.props.onlineUsers });
                if (this.isUserOnline(this.state.receiver, this.props.onlineUsers)) {
                    this.setState({ loading: false });
                }
            }
        }

        if (this.props.match.params.username !== undefined && this.props.match.params.username !== null) {
            if (this.props.match.params.username !== prevProps.match.params.username) {
                if (this.isUserOnline(this.props.match.params.username, this.state.onlineUsers)) {
                    this.setState({ receiver: this.props.match.params.username, loading: true });
                    this.loadData(500);
                }
            }
        }

        if (this.props.isOnCall !== undefined && this.props.isOnCall !== null) {
            console.log("is on call", this.props.isOnCall)
            if (this.props.isOnCall !== prevProps.isOnCall) {
                this.setState({ isOnCall: this.props.isOnCall });
            }
        }
    }

    isUserOnline = (usernameReq, onlineUsers) => {
        return onlineUsers.some((username) => username === usernameReq);
    }

    handleCall = (e, isAudioCall) => {
        e.preventDefault();
        console.log("making a call to......", this.state.receiver, " ", this.state.sender);
        this.setState({ isOnCall: true });
        var videoCallWindow = window.open("/videocall", "Popup", "toolbar=no, location=no, statusbar=no, menubar=no, scrollbars=1, resizable=0, width=1024, height=576, top=30");
        videoCallWindow.sender = this.state.sender;
        videoCallWindow.receiver = this.state.receiver;
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
                    <div className="user-avatar">{this.state.receiver ? this.state.receiver[0] : `...`}</div>

                    <div className="chat-about">
                        <div className="chat-with">{this.state.receiver}</div>
                    </div>

                    <div className="chat-call">
                        <button onClick={(e) => this.handleCall(e, true)} disabled={this.state.isOnCall}><i className="fas fa-phone-alt"></i></button>
                        <button onClick={(e) => this.handleCall(e, false)} disabled={this.state.isOnCall}><i className="fas fa-video" disabled={this.state.isOnCall}></i></button>
                    </div>
                </div>
                <div className="chat-history">
                    {this.state.loading ? <div className="loader"></div> :
                        <ul>

                        </ul>
                    }
                </div>
                <div className="chat-message clearfix">
                    <textarea className="form-control message-to-send" id="message-to-send" placeholder="Type your message" rows="1"></textarea>
                    <button>Send</button>

                </div>

            </div>
        )
    }
}
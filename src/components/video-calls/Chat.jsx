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
            this.setState({ onlineUsers: this.props.onlineUsers });
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
                            {/* <li class="clearfix">
                                <div class="message-data align-right">
                                    <span class="message-data-time" >10:10 AM, Today</span> &nbsp; &nbsp;
                            <span class="message-data-name" >Olia</span> <i class="fa fa-circle me"></i>

                                </div>
                                <div class="message other-message float-right">
                                    Hi Vincent, how are you? How is the project coming along?
                          </div>
                            </li>

                            <li>
                                <div class="message-data">
                                    <span class="message-data-name"><i class="fa fa-circle online"></i> Vincent</span>
                                    <span class="message-data-time">10:12 AM, Today</span>
                                </div>
                                <div class="message my-message">
                                    Are we meeting today? Project has been already finished and I have results to show you.
                          </div>
                            </li>

                            <li class="clearfix">
                                <div class="message-data align-right">
                                    <span class="message-data-time" >10:14 AM, Today</span> &nbsp; &nbsp;
                            <span class="message-data-name" >Olia</span> <i class="fa fa-circle me"></i>

                                </div>
                                <div class="message other-message float-right">
                                    Well I am not sure. The rest of the team is not here yet. Maybe in an hour or so? Have you faced any problems at the last phase of the project?
                          </div>
                            </li>

                            <li>
                                <div class="message-data">
                                    <span class="message-data-name"><i class="fa fa-circle online"></i> Vincent</span>
                                    <span class="message-data-time">10:20 AM, Today</span>
                                </div>
                                <div class="message my-message">
                                    Actually everything was fine. I'm very excited to show this to our team.
                          </div>
                            </li>

                            <li>
                                <div class="message-data">
                                    <span class="message-data-name"><i class="fa fa-circle online"></i> Vincent</span>
                                    <span class="message-data-time">10:31 AM, Today</span>
                                </div>
                                <i class="fa fa-circle online"></i>
                                <i class="fa fa-circle online" ></i>
                                <i class="fa fa-circle online"  ></i>
                            </li> */}

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
import React from "react";
import { Link } from "react-router-dom";

export default class Chat extends React.Component {
    render() {
        return (
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
        )
    }
}
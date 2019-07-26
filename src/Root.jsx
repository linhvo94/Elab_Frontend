import React from "react";
import { connect } from "react-redux";
import './styles/style.css';
import { BrowserRouter, Switch, Route, Link, Redirect } from "react-router-dom";

import io from "socket.io-client";
// import App from './components/App.jsx/index.js';
// import Draft from "./components/video-calls/VideoCall.jsx";
// import Chat from "./components/chatting/Chat.jsx";
import Media from './components/video-calls/Media.jsx';
import Login from "./components/login/Login.jsx";
import Signup from "./components/login/Signup.jsx";
import GroupChat from "./components/chatting/GroupChat.jsx";
import VideoCall from "./components/video-calls/VideoCall.jsx";
import LiveStream from "./components/livestream/LiveStream.jsx";

import { login, signup } from "./actions/authentication-actions/authentication.js";

//import calling-actions
// import { connectToSignalingServer, initiatePeerConnection } from "./actions/calling-actions/calling.js";

class Root extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // socket: io(SIGNALING_SERVER_URL)
        }
    }

    componentDidMount() {
        // this.setState({socket: io(SIGNALING_SERVER_URL)});
    }

    render() {
        return (
            <BrowserRouter>
                <React.Fragment>
                    {/* <VideoCall /> */}

                    <Route exact path="/livestream" render={(props) => <LiveStream /> }/>
                    
                    {/* <Chat /> */}
                    <Route exact path="/login" render={(props) =>
                        <Login {...props} 
                                authentication={this.props.authentication}
                                login={this.props.login} />} />

                    {/* <Route exact path="/chatting" render={(props) => <Chat /> }/> */}
                    <Route exact path="/signup" render={(props) => 
                        <Signup {...props} 
                                registration={this.props.registration} 
                                signup={this.props.signup} />} />
                                
                    <Route exact path="/chatting" render={(props) => <GroupChat /> }/>

                    <Route exact path = "/media" render={(props) => <Media socket={this.state.socket} />}/>
                    <Route exact path = "/videocall" render={(props) => <VideoCall />}/>
                </React.Fragment>
            </BrowserRouter>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        calling: state.calling,
        authentication: state.authentication,
        registration: state.registration
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        // connectToSignalingServer: () => { dispatch(connectToSignalingServer()) }
        login: (user) => { dispatch(login(user)) },
        signup: (user) => { dispatch(signup(user)) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Root);
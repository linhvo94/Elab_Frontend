import React from "react";
import { connect } from "react-redux";
import './styles/style.css';
import { BrowserRouter, Switch, Route, Link, Redirect } from "react-router-dom";

import io from "socket.io-client";
import Media from './components/video-calls/Media.jsx';
import Login from "./components/login/Login.jsx";
import Signup from "./components/login/Signup.jsx";
import LiveStream from "./components/livestream/LiveStream.jsx";
import LiveStream1 from "./components/livestream/LiveStream1.jsx";
import Header from "./components/general/Header.jsx";
import Body from "./components/general/Body.jsx";
import VideoCall from "./components/video-calls/VideoCall.jsx";

import { login, signup } from "./actions/authentication-actions/authentication.js";
import LiveStreamDetail from "./components/livestream/LiveStreamDetail";


class Root extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        this.sfu = null;
    }

    componentDidMount() {
        // initJanus().then(sfu => {
        //     console.log("WHATUP", sfu);
        //     // sessionStorage.setItem("sfu", sfu);
        //     sessionStorage.setItem("sfu", JSON.stringify(sfu));
        // });
    }


    render() {
        return (
            <BrowserRouter>
                <React.Fragment>
                    <Route path="/" render={(props) => (props.location.pathname === "/" ||
                        props.location.pathname === "/home" || props.location.pathname === "/aboutus" ||
                        props.location.pathname === "/media" || props.location.pathname === "/livestream")
                        && <Header {...props} authenticated={this.props.authentication.authenticated} />} />

                    <Route path="/" render={(props) => (props.location.pathname === "/" ||
                        props.location.pathname === "/home") && <Body />} />

                    <Route exact path="/media" render={(props) =>
                        !this.props.authentication.authenticated ?
                            <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                            : <Media />
                    } />

                    <Route exact path="/livestream" render={(props) =>
                        !this.props.authentication.authenticated ?
                            <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                            : <LiveStream />
                    } />

                    <Route path="/livestream/:id" render={(props) =>
                        !this.props.authentication.authenticated ?
                            <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                            : <LiveStreamDetail {...props} />

                    } />

                    <Route exact path="/livestream1" render={(props) =>
                        !this.props.authentication.authenticated ?
                            <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                            : <LiveStream1 />
                    } />

                    <Route />
                    <Route exact path="/login" render={(props) =>
                        <Login {...props}
                            authentication={this.props.authentication}
                            login={this.props.login} />} />

                    <Route exact path="/signup" render={(props) =>
                        <Signup {...props}
                            registration={this.props.registration}
                            signup={this.props.signup} />} />

                    <Route exact path="/videocall" render={(props) => <VideoCall />} />

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
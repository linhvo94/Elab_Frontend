import React from "react";
import { connect } from "react-redux";
import './styles/style.css';
import { BrowserRouter, Switch, Route, Link, Redirect } from "react-router-dom";

import Media from './components/video-calls/Media.jsx';
import Login from "./components/login/Login.jsx";
import Signup from "./components/login/Signup.jsx";
import LiveStream from "./components/livestream/LiveStream.jsx";
import LiveStreamForm from "./components/livestream/LiveStreamForm.jsx";
import Header from "./components/general/Header.jsx";
import Body from "./components/general/Body.jsx";
import VideoCall from "./components/video-calls/VideoCall.jsx";
import LiveStreamDetail from "./components/livestream/LiveStreamDetail.jsx";
import ScreenSharing from "./components/video-calls/ScreenSharing.jsx"
import SideBar from "./components/video-calls/Sidebar.jsx";

import { login, signup, logout } from "./actions/authentication-actions/authentication.js";
import { fetchAllLiveStreams, createLiveStream, getALiveStream } from "./actions/livestream-actions/livestreaming.js";
import LoginYoutube from "./components/livestream/LoginYoutube";


class Root extends React.Component {

    render() {
        return (
            <BrowserRouter>
                <React.Fragment>
                    {/* <LoginYoutube /> */}

                    <Route exact path="/screen" render={(props) => <LoginYoutube />} />

                    <Route path="/" render={(props) => (props.location.pathname === "/" ||
                        props.location.pathname === "/home")
                        && <Header {...props}
                            authenticated={this.props.authentication.authenticated}
                            logout={this.props.logout}
                        />} />

                    <Route path="/" render={(props) => (props.location.pathname === "/" ||
                        props.location.pathname === "/home") && <Body />} />

                    <Route exact path="/videocall" render={(props) => <VideoCall />} />

                    {/* <Route exact path="/screen" render={(props) => <ScreenSharing />} /> */}

                    <Route exact path="/login" render={(props) =>
                        <Login {...props}
                            authentication={this.props.authentication}
                            login={this.props.login} />} />

                    <Route exact path="/signup" render={(props) =>
                        <Signup {...props}
                            registration={this.props.registration}
                            signup={this.props.signup} />} />


                    <div className="insider-page">
                        <div className="row">
                            <Route path="/" render={(props) => (props.location.pathname === "/media" ||
                                props.location.pathname === "/livestream" || props.location.pathname.includes("/livestream/") || props.location.pathname === "/create-stream" ||
                                props.location.pathname.includes("/media/"))
                                && <SideBar {...props}
                                />} />

                            <Switch>
                                <Route path="/media" render={(props) =>
                                    !this.props.authentication.authenticated ?
                                        <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                                        : <Media {...props} />
                                } />

                                <Route exact path="/create-stream" render={(props) =>
                                    <LiveStreamForm {...props}
                                        createLiveStream={this.props.createLiveStream}
                                        roomCreated={this.props.roomCreated} />
                                } />

                                <Route exact path="/livestream" render={(props) =>
                                    !this.props.authentication.authenticated ?
                                        <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                                        : <LiveStream  {...props}
                                            livestreams={this.props.livestreams}
                                            fetchAllLiveStreams={this.props.fetchAllLiveStreams} />
                                } />

                                <Route path="/livestream/:id" render={(props) =>
                                    !this.props.authentication.authenticated ?
                                        <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                                        : <LiveStreamDetail {...props}
                                            livestream={this.props.livestream}
                                            getALiveStream={this.props.getALiveStream} />
                                } />
                            </Switch>
                        </div>

                    </div>

                </React.Fragment>
            </BrowserRouter >
        )
    }
}

const mapStateToProps = (state) => {
    return {
        calling: state.calling,
        authentication: state.authentication,
        registration: state.registration,
        livestreams: state.livestreams.livestreams,
        roomCreated: state.livestreams.roomCreated,
        livestream: state.livestreams.livestream
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        // connectToSignalingServer: () => { dispatch(connectToSignalingServer()) }
        login: (user) => { dispatch(login(user)) },
        signup: (user) => { dispatch(signup(user)) },
        logout: () => { dispatch(logout()) },
        fetchAllLiveStreams: () => { dispatch(fetchAllLiveStreams()) },
        createLiveStream: (livestream) => { dispatch(createLiveStream(livestream)) },
        getALiveStream: (id) => { dispatch(getALiveStream(id)) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Root);
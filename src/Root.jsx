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
import SideBar from "./components/general/Sidebar.jsx";

import { login, signup, logout } from "./actions/authentication-actions/authentication.js";
import { fetchAllLiveStreams, createLiveStream, getALiveStream, updateALiveStream, deleteALiveStream } from "./actions/livestream-actions/livestreaming.js";
import Conference from "./components/conference/Conference";
import ConferenceCall from "./components/conference/ConferenceCall";


class Root extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    componentDidMount() {
    }

    render() {
        return (
            <BrowserRouter>
                <React.Fragment>
                    <Route path="/" render={(props) => (props.location.pathname === "/" ||
                        props.location.pathname === "/home")
                        && <React.Fragment>
                            <Header {...props}
                                authenticated={this.props.authentication.authenticated}
                                logout={this.props.logout} />
                            <Body />
                        </React.Fragment>

                    } />

                    <Route exact path="/videocall" render={(props) => <VideoCall />} />
                    <Route path="/conferencecall" render={(props) => <ConferenceCall />} />

                    <Route exact path="/login" render={(props) =>
                        <Login {...props}
                            authentication={this.props.authentication}
                            login={this.props.login} />} />

                    <Route exact path="/signup" render={(props) =>
                        <Signup {...props}
                            registration={this.props.registration}
                            signup={this.props.signup} />} />


                    <div className="row no-gutters">
                        <div className="col-1 col-sm-1 col-md-1 col-lg-1 col-xl-1">
                            <Route path="/" render={(props) => (props.location.pathname === "/media" ||
                                props.location.pathname === "/livestream" || props.location.pathname.includes("/livestream/") || 
                                props.location.pathname === "/create-stream" ||
                                props.location.pathname.includes("/media/") || props.location.pathname === "/conference")
                                && <SideBar {...props}
                                />} />
                        </div>
                        <div className="col-11 col-sm-11 col-md-11 col-lg-11 col-xl-11">
                            <Route path="/media" render={(props) =>
                                !this.props.authentication.authenticated ?
                                    <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                                    : <Media {...props} />
                            } />

                            <Route path="/conference" render={(props) =>
                                !this.props.authentication.authenticated ?
                                    <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
                                    : <Conference {...props}/>
                            } />


                            <Route exact path="/create-stream" render={(props) =>
                                !this.props.authentication.authenticated ?
                                    <Redirect to={{ pathname: "/login", state: { from: props.location } }} /> :
                                    <LiveStreamForm {...props}
                                        createLiveStream={this.props.createLiveStream}
                                        livestream={this.props.livestream} />
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
                                        getALiveStream={this.props.getALiveStream}
                                        updateALiveStream={this.props.updateALiveStream}
                                    />
                            } />
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
        livestream: state.livestreams.livestream,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        login: (user) => { dispatch(login(user)) },
        signup: (user) => { dispatch(signup(user)) },
        logout: () => { dispatch(logout()) },
        fetchAllLiveStreams: () => { dispatch(fetchAllLiveStreams()) },
        createLiveStream: (livestream) => { dispatch(createLiveStream(livestream)) },
        getALiveStream: (id) => { dispatch(getALiveStream(id)) },
        updateALiveStream: (id) => { dispatch(updateALiveStream(id)) },
        deleteALiveStream: (id) => { dispatch(deleteALiveStream(id)) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Root);
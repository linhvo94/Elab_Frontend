import React from "react";
import Janus from "../../utils/janus-utils/janus.js";
import uuid from "uuid/v4";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";
import UploadingVideoDialog from "./UploadingVideoDialog.jsx";


export default class LiveStreamDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomID: "",
            firstName: "",
            lastName: "",
            participantID: "",
            publisherID: "",
            isPublisher: null,
            isStreamPlaying: null,
            isPublishing: null,
            fullScreen: false,
            livestream: null,
            title: "",
            description: "",
            publisherName: "",
            url: "",
            error: "",
            loading: true,
            progress: null,
            onScreenSharing: false
        }
        this.janus = null;
        this.sfu = null;
        this.streamRecorder = null;
        this.totalStreamBlobs = [];
        this.streamBlobs = [];
        this.liveStream = null;
        this.uploadVideoBlob = null;
        this.liveStreamSrc = React.createRef();
    }

    componentDidMount() {
        if (this.props.match.params.id !== undefined && this.props.match.params.id !== null && !isNaN(parseInt(this.props.match.params.id))) {
            this.livestreamPrepare();
            this.props.getALiveStream(this.props.match.params.id);

            initJanus().then(data => {
                this.sfu = data.sfu;
                this.janus = data.janus;
                this.setState({ loading: false, isPublishing: false });
                this.getRoomList();
                if (!this.state.isPublisher) {
                    this.checkRoomExistence().then(message => {
                        this.subscribeStream(message.room, this.state.publisherID);
                    });
                }
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.livestream !== undefined && this.props.livestream !== null && this.props.livestream !== prevProps.livestream) {
            console.log("LIVESTREAM from database: ", this.props.livestream);
            this.setState({ publisherID: this.props.livestream.publisher.id });

            // if (this.props.livestream.url === null || this.props.livestream.status !== "ended") {
            if (this.props.livestream.url === null) {
                if (this.state.participantID === this.props.livestream.publisher.id) {
                    this.setState({ isPublisher: true });
                    console.log("is publisher");
                } else {
                    this.setState({ isPublisher: false });
                    console.log("is subcriber");
                }

                this.setState({
                    livestream: this.props.livestream,
                    title: this.props.livestream.title,
                    description: this.props.livestream.description,
                    publisherName: `${this.props.livestream.publisher.firstName} ${this.props.livestream.publisher.lastName}`,
                    url: this.props.livestream.url
                });
            }
        }
    }


    getRoomList = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "list" };
            this.sfu.send({
                message: body, success: (message) => {
                    console.log("ROOM", message);
                }
            });
        } else {
            console.log("SFU is null");
        }
    }

    livestreamPrepare = () => {
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null) {
            if (user.id !== undefined && user.id !== null) {
                this.setState({ participantID: user.id });
            }

            if (user.firstName !== undefined && user.firstName !== null) {
                this.setState({ firstName: user.firstName });
            }

            if (user.lastName !== undefined && user.lastName !== null) {
                this.setState({ lastName: user.lastName });
            }
        }
    }

    publishStream = () => {
        this.checkRoomExistence().then(message => {
            this.setState({ roomID: message.room });
            let publisherConfig = {
                request: "join",
                ptype: "publisher",
                room: message.room,
                id: this.state.participantID,
                display: this.state.title
            };

            this.sfu.send({ message: publisherConfig });

        }).catch(e => console.log(e));

        this.sfu.onmessage = (message, jsep) => {
            Janus.log("::: Got a message ::: ", message);
            let event = message.videoroom;
            Janus.log(("Event: " + event));
            if (event !== undefined && event !== null) {
                if (event === "joined") {
                    console.log("MESSAGE", message);
                    Janus.log("Successfully joined room " + message.room + " with ID " + message.id);
                    this.configStream();
                    window.addEventListener("beforeunload", () => this.leaveLiveStreamRoom());

                } else if (event === "event") {
                    if (message.unpublished !== undefined && message.unpublished !== null) {
                        if (message.unpublished === "ok") {

                            // console.log("Unpublish and create Screen sharing");

                        }
                    }
                }
            }

            if (jsep !== undefined && jsep !== null) {
                Janus.log("Handling SDP as well...");
                Janus.log(jsep);
                this.sfu.handleRemoteJsep({ jsep: jsep });
            }
        }

        this.sfu.onlocalstream = (stream) => {
            Janus.log(" ::: Got a local stream ::: ", stream);
            this.liveStreamSrc.current.srcObject = stream;
            this.liveStream = stream;
            this.startStreamRecording();
        }
        this.sfu.oncleanup = () => {

        }
    }

    checkRoomExistence = () => {
        return new Promise((resolve, reject) => {
            if (this.sfu !== undefined && this.sfu !== null) {
                let body = { request: "exists", room: parseInt(this.props.match.params.id) };
                this.sfu.send({
                    message: body, success: (message) => {
                        console.log("EXIST: ", message);
                        if (message.exists) {
                            resolve(message);
                        } else {
                            this.setState({ error: "Livestream is unavailable" });
                            reject(message);
                        }
                    }
                });
            } else {
                console.log("Cannot find janus instance");
            }
        });
    }

    configStream = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            this.sfu.createOffer({
                media: { audioRecv: false, videoRecv: false, audioSend: true, videoSend: true },
                success: (jsep) => {
                    Janus.log("Got publisher SDP!");
                    let publish = { request: "configure", audio: true, video: true };
                    this.sfu.send({ message: publish, jsep: jsep });
                    this.setState({ isPublishing: true });
                    this.updateLiveStreamStatus("live");
                },
                error: (error) => {
                    Janus.error("WebRTC error: ", error);
                    console.log("WebRTC error... " + JSON.stringify(error));

                }
            });
        }
    }

    updateLiveStreamStatus = (status) => {
        let livestream = this.state.livestream;
        livestream.status = status;
        this.setState({ livestream: livestream });
        this.props.updateALiveStream(livestream);
    }

    pauseStream = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "pause" }
            this.sfu.send({ message: body });
        }
    }

    resumeStream = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "start" };
            this.sfu.send({ message: body });
        }
    }

    stopPublishingStream = (e) => {
        e.preventDefault();
        this.stopStreamRecording();
        let unpublishConfig = { request: "unpublish" };
        this.sfu.send({ message: unpublishConfig });
        this.updateLiveStreamStatus("ended");
        this.handleYoutubeVideoUpload();
    }

    leaveLiveStreamRoom = () => {
        // let leavingRoomConfig = { request: "leave" };
        // this.sfu.send({ message: leavingRoomConfig });
    }

    subscribeStream = (roomID, publisherID) => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let subscriberConfig = {
                request: "join",
                ptype: "subscriber",
                room: roomID,
                feed: publisherID
            };

            this.sfu.videoCodec = "vp8".toUpperCase();
            this.sfu.send({ message: subscriberConfig });

            this.sfu.onmessage = (message, jsep) => {
                console.log(message);
                let event = message.videoroom;

                if (event !== undefined && event !== null) {
                    if (event === "attached") {
                        window.addEventListener("beforeunload", () => this.leaveLiveStreamRoom());
                    } else if (event === "event") {
                        if (message.started !== undefined && message.started !== null) {
                            if (message.started === "ok") {
                                console.log("START SUCCESS");
                                this.setState({ isStreamPlaying: true });
                            }
                        } else if (message.paused !== undefined && message.paused !== null) {
                            if (message.paused === "ok") {
                                console.log("PAUSED SUCCESS");
                                this.setState({ isStreamPlaying: false });
                            }
                        }
                    }
                }

                if (jsep !== undefined && jsep !== null) {
                    Janus.log("Handling SDP as well...");
                    this.sfu.createAnswer({
                        jsep: jsep,
                        media: { audioSend: false, videoSend: false },
                        success: (jsep) => {
                            let body = { request: "start", room: roomID };
                            this.sfu.send({ message: body, jsep: jsep });
                        },
                        error: (error) => {
                            Janus.log("Error: ", error);
                        }
                    });
                }
            }

            this.sfu.onremotestream = (stream) => {
                Janus.log(" ::: Got a remote stream ::: ", stream);
                this.liveStreamSrc.current.srcObject = stream;
            }

            this.sfu.error = (error) => {
                console.log(error);
            }
            this.sfu.oncleanup = () => {
                this.liveStreamSrc.current.srcObject = null;
            }

        } else {
            console.log("Cannot find janus instance");
        }


    }

    startStreamRecording = () => {
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not Supported`);
            options = { mimeType: 'video/webm;codecs=vp8' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not Supported`);
                options = { mimeType: 'video/webm' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error(`${options.mimeType} is not Supported`);
                    options = { mimeType: '' };
                }
            }
        }

        try {
            this.streamRecorder = new MediaRecorder(this.liveStream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }

        console.log('Created MediaRecorder', this.streamRecorder, 'with options', options);

        this.streamRecorder.onstop = (event) => {
            console.log('Recorder stopped: ', event);
            let livestreamVideo = document.getElementById("livestream-video");
            // console.log(this.streamBlobs);
            // this.uploadVideoBlob = new Blob(this.streamBlobs, { type: this.streamRecorder.mimeType });
            // livestreamVideo.srcObject = null;
            // livestreamVideo.src = null;
            // livestreamVideo.src = window.URL.createObjectURL(this.uploadVideoBlob);
        };

        this.streamRecorder.ondataavailable = this.handleDataAvailable;
        this.streamRecorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', this.streamRecorder);
    }


    handleDataAvailable = (event) => {
        if (event.data && event.data.size > 0) {
            this.streamBlobs.push(event.data);
        }
    }

    stopStreamRecording = () => {
        if (this.streamRecorder !== undefined && this.streamRecorder !== null) {
            this.streamRecorder.stop();
            this.uploadVideoBlob = new Blob(this.streamBlobs, { type: this.streamRecorder.mimeType });
        }
    }

    handleMediaStream = (e) => {
        e.preventDefault();
        if (this.sfu !== undefined && this.sfu !== null) {
            let media = "";
            if (this.state.onScreenSharing) {
                media = { video: true, replaceVideo: true, audioSend: true, audioRecv: false, videoRecv: false };
            } else {
                media = { video: "screen", replaceVideo: true, audioSend: true, audioRecv: false, videoRecv: false };
            }

            this.sfu.createOffer({
                media: media,
                success: (jsep) => {
                    Janus.log(jsep);
                    let screenSharingConfig = { request: "configure" };
                    this.sfu.send({ message: screenSharingConfig, jsep: jsep });
                },
                error: function (error) {
                    Janus.log("WebRTC error:", error);
                }
            });

            this.setState({ onScreenSharing: !this.state.onScreenSharing });
        }
    }



    openFullScreen = () => {
        this.setState({ fullScreen: true });
        let videoContainer = document.getElementById("video-container");
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
            videoContainer.mozRequestFullScreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
        }
    }

    exitFullScreen = () => {
        this.setState({ fullScreen: false });

        if (document.exitFullScreen) {
            document.exitFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    handleYoutubeVideoUpload = () => {
        window.gapi.auth2.getAuthInstance().isSignedIn.listen(this.handleAuthStatus);
        this.handleAuthStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
    }

    handleAuthStatus = (isSignedIn) => {
        if (!isSignedIn) {
            window.gapi.auth2.getAuthInstance().signIn();
        } else {
            this.makeVideoUploadRequest();
        }
    }

    makeVideoUploadRequest = () => {
        let xhr = new XMLHttpRequest();
        console.log(window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse());
        xhr.open('POST', "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet%2Cstatus", true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
        xhr.responseType = 'json';
        if (xhr.upload) {
            xhr.upload.onprogress = (data) => {
                let progress = Math.round((data.loaded / data.total) * 100);
                this.setState({ progress: progress });
                console.log(`${progress} % uploading`);
            }

            xhr.upload.onerror = (error) => {
                console.log("ERROR UPLOAD", error);
            }

        }

        xhr.onload = () => {
            console.log(xhr.response);
            if (xhr.response.id !== undefined && xhr.response.id !== null) {
                let youtubeURL = `https://www.youtube.com/embed/${xhr.response.id}`;
                let livestream = this.state.livestream;
                livestream.url = youtubeURL;
                this.setState({ url: youtubeURL, livestream: livestream });
                console.log("CURRENT LIVESTREAM", livestream);
                // this.props.updateALiveStream(livestream);
                // setTimeout(() => {
                //     this.closeUploadingVideoDialog();
                //     this.destroyRoom();
                // }, 1000);
            }
        };

        let parameters = JSON.stringify({
            snippet: {
                description: this.state.description,
                title: this.state.title
            },
            status: {
                privacyStatus: "public"
            }
        });

        let jsonBlob = new Blob([parameters], { type: "application/json" });
        let formData = new FormData();
        formData.append("snippet", jsonBlob, "file.json");
        formData.append("file", this.uploadVideoBlob, (this.state.title.toLowerCase()).replace(/\s/g, ''));
        xhr.send(formData);
        this.setState({ progress: 0 });
    }

    closeUploadingVideoDialog = () => {
        this.setState({ progress: null });
    }

    destroyRoom = () => {
        let body = { request: "destroy", room: this.state.roomID };
        this.sfu.send({
            message: body, success: (message) => {
                console.log(message);
            }
        });
    }

    componentWillUnmount() {
        this.leaveLiveStreamRoom();
        // this.destroyRoom();
    }

    render() {
        return (
            <React.Fragment>
                {this.state.loading ? <div className="loader"></div> :
                    <React.Fragment>
                        {this.state.progress === null || this.state.progress === 100 ? null :
                            <UploadingVideoDialog progress={this.state.progress}
                                closeUploadingVideoDialog={this.closeUploadingVideoDialog} />}
                        <div className="col-7 col-sm-7 col-md-7 col-lg-7 col-xl-7 livestreamdetail-container">
                            <div className="livestreamdetail-header">
                                <label>{this.state.title}</label>
                                {
                                    this.state.url !== null ? null :
                                        !this.state.isPublisher ? null :
                                            this.state.isPublishing === null ? null :
                                                this.state.isPublishing ? <button onClick={this.stopPublishingStream}>Stop Publishing</button>
                                                    :
                                                    <button onClick={this.publishStream}>Start Publishing</button>
                                }
                            </div>
                            <div className="livestreamdetail-videocontainer">
                                {this.state.url === null ?
                                    <div className="video-container" id="video-container">
                                        <video className="livestream-video" id="livestream-video" ref={this.liveStreamSrc} autoPlay muted></video>
                                        <div className="controls">
                                            <div className="video-progress-bar">
                                                <div className="video-progress-bar-color">

                                                </div>
                                            </div>

                                            <div className="video-buttons">
                                                {this.state.isPublisher ? null :
                                                    this.state.isStreamPlaying === null ? null :
                                                        this.state.isStreamPlaying ?
                                                            <button type="button" id="play-button" onClick={this.pauseStream}>
                                                                <i className="fas fa-pause"></i>
                                                            </button>
                                                            : <button type="button" id="play-button" onClick={this.resumeStream}>
                                                                <i className="fas fa-play"></i>
                                                            </button>}


                                                {this.state.isPublishing ? <button type="button" id="screen-sharing-button" className="" title={this.state.onScreenSharing ? "Switch back to your camera" : "Click to share screen"} onClick={this.handleMediaStream}>
                                                    {this.state.onScreenSharing ? <i className="fas fa-desktop"></i> : <span><i className="fas fa-slash"></i><i className="fas fa-desktop"></i></span>}
                                                </button> : null}

                                                {this.state.fullScreen ?
                                                    <button type="button" id="screen-adjust-button" onClick={this.exitFullScreen}>
                                                        <i className="fas fa-compress"></i>
                                                    </button>
                                                    :
                                                    <button type="button" id="screen-adjust-button" onClick={this.openFullScreen}>
                                                        <i className="fas fa-expand"></i>
                                                    </button>
                                                }


                                            </div>
                                        </div>
                                    </div> :
                                    <div className="video-container" id="video-container">
                                        <iframe title={this.state.title} className="livestream-video"
                                            src={this.state.url}
                                            allowFullScreen frameBorder="0">
                                        </iframe>
                                    </div>
                                }
                            </div>

                            <div className="livestreamdetail-description">
                                <label>Lecturer: {this.state.publisherName} </label>
                                <p>{this.state.description}</p>
                            </div>
                        </div>

                        <div className="col-4 col-sm-4 col-md-4 col-lg-4 col-xl-4 livestreamdetail-chat-container">
                            <div className="livestreamdetail-chat-header">
                                <label>Live Chat</label>
                            </div>

                            <div className="livestreamdetail-chat">
                                <ul>

                                </ul>
                            </div>

                            <div className="livestreamdetail-message">
                                <textarea className="message-to-send" id="message-to-send" placeholder="Type your message" rows="1"></textarea>
                                <button>Send</button>

                            </div>
                        </div>
                    </React.Fragment>
                }
            </React.Fragment >
        )
    }

}
import React from "react";
import { signinAccount, handleGoogleClientLoad } from "../../actions/livestream-actions/youtube";
import { handleGetUserMedia } from "../webrtc-usermedia/usermedia-control.js";
import { UploadingVideoDialog } from "./UploadingVideoDialog";

export default class LoginYoutube extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        this.GoogleAuth = null;
        this.localStream = null;
        this.localStreamSource = React.createRef();
        this.streamRecorder = null;
        this.streamBlobs = null;
        this.liveStream = null;
        this.gapi = null;
        this.blob = null;

    }

    componentDidMount() {
        this.gapi = window.gapi;
    }

    handleDataAvailable = (event) => {
        if (event.data && event.data.size > 0) {
            this.streamBlobs.push(event.data);
        }
    }

    // getStream = (e) => {
    //     e.preventDefault();
    //     handleGetUserMedia({ video: true, audio: false }).then(stream => {
    //         this.localStreamSource.current.srcObject = stream;
    //         this.localStream = stream;
    //         this.liveStream = stream;
    //         this.streamBlobs = [];

    //         let options = { mimeType: 'video/webm;codecs=vp9' };
    //         if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    //             console.error(`${options.mimeType} is not Supported`);
    //             options = { mimeType: 'video/webm;codecs=vp8' };
    //             if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    //                 console.error(`${options.mimeType} is not Supported`);
    //                 options = { mimeType: 'video/webm' };
    //                 if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    //                     console.error(`${options.mimeType} is not Supported`);
    //                     options = { mimeType: '' };
    //                 }
    //             }
    //         }

    //         try {
    //             this.streamRecorder = new MediaRecorder(stream, options);
    //         } catch (e) {
    //             console.error('Exception while creating MediaRecorder:', e);
    //             return;
    //         }

    //         console.log('Created MediaRecorder', this.streamRecorder, 'with options', options);
    //         this.streamRecorder.ondataavailable = this.handleDataAvailable;
    //         this.streamRecorder.onstop = (event) => {
    //             console.log('Recorder stopped: ', event);
    //             let livestreamVideo = document.getElementById("livestream-video");
    //             livestreamVideo.srcObject = null;
    //             livestreamVideo.src = null;
    //             this.createVideoFile().then(videoFile => {
    //                 this.uploadVideo = livestreamVideo.src = videoFile;
    //                 this.handleGoogleSignin();
    //             });
    //         };

    //         this.streamRecorder.ondataavailable = this.handleDataAvailable;
    //         this.streamRecorder.start(100); // collect 10ms of data
    //         console.log('MediaRecorder started', this.streamRecorder);
    //     }).catch(e => console.log(e));
    // }

    // handleGoogleSignin = () => {
    //     window.gapi.auth2.getAuthInstance().isSignedIn.listen(this.handleAuthStatus);
    //     this.handleAuthStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
    // }

    // handleAuthStatus = (isSignedIn) => {
    //     if (!isSignedIn) {
    //         window.gapi.auth2.getAuthInstance().signIn();
    //     } else {
    //         this.makeVideoUploadRequest();
    //     }
    // }

    // makeVideoUploadRequest = async () => {
    //     var xhr = new XMLHttpRequest();
    //     console.log(window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse());
    //     xhr.open('POST', "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet%2Cstatus", true);
    //     xhr.setRequestHeader('Authorization', 'Bearer ' + window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
    //     xhr.responseType = 'json';
    //     if (xhr.upload) {
    //        xhr.upload.onprogress = (data) => {
    //             let progress = Math.round((data.loaded / data.total) * 100);
    //             console.log(`${progress} % uploading`);
    //        }

    //     }

    //     xhr.onload = () => {
    //         console.log("YOUTUBE RESPONSE", xhr.response);
    //     };

    //     var parameters = JSON.stringify({
    //             "snippet": {
    //               "description": this.state.description,
    //               "title": this.state.title
    //             },
    //             "status": {
    //                 "privacyStatus": "private"
    //             }
    //           }
    //     );
    //     var jsonBlob = new Blob([parameters], {type: 'application/json'});
    //     var fd = new FormData();
    //     fd.append("snippet", jsonBlob, "file.json");
    //     fd.append("file", this.blob);
        
    //     xhr.send(fd);
    //     let startTime = Date.now();
    // }

    // createVideoFile = () => {
    //     return new Promise(resolve => {
    //         const superBuffer = new Blob(this.streamBlobs, { type: 'video/webm' });
    //         this.blob = superBuffer;
    //         resolve(window.URL.createObjectURL(superBuffer));
    //     });
    // }

    // onUploadProgress = (event) => {
    //     const progress = Math.round((event.bytesRead / this.uploadVideo.size) * 100);
    //     console.log(`${progress} % uploading`);
    // }

    // // getChannel = () => {
    // //     window.GAPI.client.youtube.channels.list({
    // //         part: "snippet, contentDetails",
    // //         id: " UC5dPTDRkMbzoybtu812eu1g"
    // //     })
    // //     .then(res => {
    // //         console.log(res);
    // //     })
    // //     .catch(e => console.log(e));
    // // }

    // stopStream = (e) => {
    //     e.preventDefault();
    //     if (this.streamRecorder !== undefined && this.streamRecorder !== null) {
    //         this.streamRecorder.stop();
    //         console.log('Recorded Blobs: ', this.streamBlobs);

    //     }
    // }


    render() {
        return (
            <div>
                
                <video id="livestream-video" className={{ "width": "200px", "height": "200px" }} ref={this.localStreamSource} muted autoPlay>

                </video>
                <button onClick={this.getStream}>Start</button>
                <button onClick={this.stopStream}>Stop</button>
                {/* <UploadingVideoDialog /> */}
            </div>
        )
    }
}
import React from "react";

export default class ScreenSharing extends React.Component {
    constructor(props) {
        super(props);
        this.enableStartCapture = true;
        this.enableStopCapture = false;
        this.enableDownloadRecording = false;
        this.localStreamSource = React.createRef();
        this.chunks = [];
        this.mediaRecorder = null;
        this.status = 'Inactive';
        this.recording = null;
    }

    startScreenCapture = () => {
       return new Promise((resolve) => {
        if (navigator.getDisplayMedia) {
            resolve(navigator.getDisplayMedia({ video: true }));
        } else if (navigator.mediaDevices.getDisplayMedia) {
            resolve(navigator.mediaDevices.getDisplayMedia({ video: true }));
        } else {
            resolve(navigator.mediaDevices.getUserMedia({ video: { mediaSource: 'screen' } }));
        }
       })
    }

    startCapturing = () => {
        this.startScreenCapture().then(stream => {
            this.localStreamSource.current.srcObject = stream;
            console.log(stream);
        })
    }

    render() {
        return (
            <div>
                <video ref={this.localStreamSource} autoPlay style={{height: "200px", width: "200px"}}>
                    
                </video>
                <button onClick={this.startCapturing}>
                        Start
                </button>
            </div>
        )
    }
}
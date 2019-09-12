import React from "react";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";
import { handleGetUserMedia } from "../webrtc-usermedia/usermedia-control.js";

export default class LiveStreamForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "",
            description: "",
            status: "created",
            roomID: Math.floor(Math.random() * 24683579),
            publisher: {}
        }

        this.sfu = null;
        this.localStream = null;
        this.localStreamSource = React.createRef();
    }

    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null) {
            this.setState({ publisher: user });
        }

        handleGetUserMedia({
            video: {
                width: { min: 640, ideal: 1280 },
                height: { min: 400, ideal: 720 },
                aspectRatio: { ideal: 1.7777777778 }
            },
            audio: true
        }).then(stream => {
            this.localStreamSource.current.srcObject = stream;
            this.localStream = stream;
        }).catch(e => console.log(e));
    }

    componentDidUpdate(prevProps) {
        if (this.props.livestream !== undefined && this.props.livestream !== null) {
            if (this.props.livestream && this.props.livestream !== prevProps.livestream) {
                this.props.history.push(`/livestream/${this.props.livestream.id}`);
            }
        }

    }


    handleChange = (e) => {
        e.preventDefault();
        this.setState({ [e.target.name]: e.target.value });
    }

    generateRoom = (sfu, roomID) => {
        return new Promise((resolve, reject) => {
            let roomConfig = {
                request: "create",
                room: roomID,
                permanent: false,
                description: this.state.title,
                publishers: 1,
                // bitrate: 128000,
                // bitrate_cap: true
            };
            sfu.send({
                message: roomConfig,
                success: (message) => {
                    console.log("=== room created === ", message);
                    resolve();
                },
                error: (error) => {
                    console.log(error);
                    let anotherRoomID = Math.floor(Math.random() * 35792468);
                    this.setState({ roomID: anotherRoomID });
                    this.generateRoom(sfu, anotherRoomID);
                    reject(error);
                }
            });
        });
    }


    createLiveStream = (e) => {
        e.preventDefault();
        initJanus().then(data => {
            this.generateRoom(data.sfu, this.state.roomID).then(() => {
                this.props.createLiveStream(this.state);
            });
        });
    }

    componentWillUnmount() {
        if (this.localStream !== null) {
            let tracks = this.localStream.getTracks();
            tracks.forEach(track => {
                track.stop();
                this.localStream.removeTrack(track);
            });

            this.localStreamSource.current.srcObject = null;
        }
    }

    render() {
        return (
            <React.Fragment>
                <div className="livestream-form-page">
                    <div className="livestream-review">
                        <div className="livestream-header">
                            Preview
                        </div>
                        <video className="preview-localstream" ref={this.localStreamSource} muted autoPlay>

                        </video>
                    </div>
                    <div className="livestream-form">
                        <form>
                            <input type="text" name="title" value={this.state.title} className="form-control"
                                onChange={this.handleChange} placeholder="Title" />
                            <textarea className="form-control" name="description" value={this.state.description}
                                onChange={this.handleChange} rows="4" placeholder="Description"></textarea>

                            <button onClick={this.createLiveStream}>Go Live</button>
                        </form>

                    </div>
                </div>
            </React.Fragment>
        )
    }
}
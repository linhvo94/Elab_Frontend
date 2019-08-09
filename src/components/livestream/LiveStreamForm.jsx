import React from "react";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";
import { handleGetUserMedia } from "../webrtc-usermedia/usermedia-control.js";

export default class LiveStreamForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "",
            description: "",
            roomID: Math.floor(Math.random() * 2468),
            publisher: {}
        }
        this.sfu = null;
        this.localStreamSource = React.createRef();
    }

    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));
        this.setState({ publisher: user });

        handleGetUserMedia({ video: true, audio: true }).then(stream => {
            this.localStreamSource.current.srcObject = stream;
        }).catch(e => console.log(e));
    }

    componentDidUpdate(prevProps) {
        console.log("ROOM created", this.props.roomCreated);
        if (this.props.roomCreated !== undefined && this.props.roomCreated !== null) {
            if (this.props.roomCreated && this.props.roomCreated !== prevProps.roomCreated) {
                this.props.history.push(`/livestream/${this.state.roomID}`);
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
                max_publishers: 1
            };
            sfu.send({
                message: roomConfig,
                success: (message) => {
                    console.log("=== room created === ", message);
                    resolve();
                },
                error: (error) => {
                    console.log(error);
                    let anotherRoomID = Math.floor(Math.random() * 3579);
                    this.setState({ roomID: anotherRoomID });
                    this.generateRoom(sfu, anotherRoomID);
                    // reject(error);
                }
            });
        });
    }


    createLiveStream = (e) => {
        e.preventDefault();
        initJanus().then(sfu => {
            this.generateRoom(sfu, this.state.roomID).then(() => {
                this.props.createLiveStream(this.state);
            });
        });
    }

    render() {
        return (
            <React.Fragment>
                <div className="col-8 livestream-review">
                    <div className="livestream-header">
                        Preview
                    </div>
                    <video className="preview-localstream" ref={this.localStreamSource} muted autoPlay>

                    </video>
                </div>
                <div className="col-3 livestream-form">
                    <form>
                        <input type="text" name="title" value={this.state.title} className="form-control"
                            onChange={this.handleChange} placeholder="Title"/>
                        <textarea className="form-control" name="description" value={this.state.description}
                            onChange={this.handleChange} rows="3" placeholder="Description"></textarea>

                        <button onClick={this.createLiveStream}>Go Live</button>
                    </form>

                </div>
            </React.Fragment>

        )
    }

}
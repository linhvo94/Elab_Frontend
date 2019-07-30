import React from "react";
import { Link } from "react-router-dom";
import Janus from "../../janus-utils/janus.js";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";



export default class LiveStream extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rooms: []
        }
        this.janus = null;
        this.janusServer = "http://e-lab.host:8088/elab";
        this.opaqueID = `videoroom - ${Janus.randomString(12)}`;
        this.sfu = null;
    }

    componentDidMount() {
         initJanus().then(sfu => {
           this.sfu = sfu
           this.getRoomList();
        });
    }

    getRoomList = () => {
        if (this.sfu !== undefined && this.sfu !== null) {
            let body = { request: "list" };
            this.sfu.send({
                message: body, success: (message) => {
                    console.log("ROOM", message);
                }
            });
        }
    }

    // initJanus = () => {
    //     Janus.init({
    //         debug: "all",
    //         callback: () => {
    //             if (!Janus.isWebrtcSupported) {
    //                 alert("Your browser does not support WebRTC. Please try different browser.");
    //                 return;
    //             } else {
    //                 this.janus = new Janus({
    //                     server: this.janusServer,
    //                     iceServers: [{ urls: "stun:e-lab.host:5349" }, { urls: "turn:e-lab.host:5349?transport=udp", username: "lcq", credential: "lcq" }, { urls: "turn:e-lab.host:5349?transport=tcp", username: "lcq", credential: "lcq" }],
    //                     success: () => {
    //                         console.log("=== success connect ===");
    //                         this.janus.attach({
    //                             plugin: "janus.plugin.videoroom",
    //                             opaqueID: this.opaqueID,
    //                             success: (pluginHandle) => {
    //                                 this.sfu = pluginHandle;
    //                                 Janus.log(`[Video Room] plugin attached!(${this.sfu.getPlugin()}, id = ${this.sfu.getId()})`);
    //                                 let body = { request: "list" };
    //                                 this.sfu.send({
    //                                     message: body, success: (data) => {
    //                                         this.setState({ rooms: data.list });
    //                                     }
    //                                 });
    //                             }
    //                         });
    //                     }
    //                 });
    //             }
    //         }
    //     })
    // }

    render() {
        console.log(this.state.rooms);
        return (
            <div className="livestream-page">
                <div className="row">
                    <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
                        <h1><i className="fas fa-wave-square"></i> Ongoing Livestreams ({this.state.rooms.length})</h1>
                        <Link className="btn btn default publish-stream-link" to={"/livestream/456"}><i className="fas fa-plus"></i> Publish Stream </Link>
                    </div>
                </div>
                <div className="row livestream-list">
                    {/* {this.state.rooms.map((room, index) =>
                        <div className="col-12 col-sm-12 col-md-6 col-lg-4 col-lg-4">
                            <div key={index} className="card" style={{ width: "18rems" }}>
                                <img src="https://cdn.dribbble.com/users/3809802/screenshots/6827845/school_life_4x.png" alt="Class" />
                                <div className="card-body">
                                    <h5 className="card-title">{room.description}</h5>
                                    <p className="card-text"></p>
                                    <Link className="btn btn-primary watchnow-link" to={"/"}>Watch now</Link>
                                </div>
                            </div>
                        </div>
                    )} */}
                    <div className="col-12 col-sm-12 col-md-6 col-lg-4 col-lg-4">
                        <div className="card" style={{ width: "18rems" }}>
                            <img src="https://cdn.dribbble.com/users/3809802/screenshots/6827845/school_life_4x.png" alt="Class" />
                            <div className="card-body">
                                <h5 className="card-title">A</h5>
                                <p className="card-text"></p>
                                <Link className="btn btn-primary" to={"/livestream/456"}>Watch now</Link>
                            </div>
                        </div>

                    </div>
                    <div className="col-12 col-sm-12 col-md-6 col-lg-4 col-lg-4">
                        <div className="card" style={{ width: "18rems" }}>
                            <img src="https://cdn.dribbble.com/users/3809802/screenshots/6827845/school_life_4x.png" alt="Class" />
                            <div className="card-body">
                                <h5 className="card-title">A</h5>
                                <p className="card-text"></p>
                                <Link className="btn btn-default watchnow-link" to={"/"}>Watch now</Link>
                            </div>
                        </div>

                    </div>
                    <div className="col-12 col-sm-12 col-md-6 col-lg-4 col-lg-4">
                        <div className="card" style={{ width: "18rems" }}>
                            <img src="https://cdn.dribbble.com/users/3809802/screenshots/6827845/school_life_4x.png" alt="Class" />
                            <div className="card-body">
                                <h5 className="card-title">A</h5>
                                <p className="card-text"></p>
                                <Link className="btn btn-primary" to={"/livestream/2"}>Watch now</Link>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
                        <h1><i className="fas fa-folder-open"></i> Past Livestreams</h1>
                    </div>
                </div>
            </div>
        )
    }
}
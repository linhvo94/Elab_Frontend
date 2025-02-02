import React from "react";

export default class UploadingVideoDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            progress: null,
            uploadMessage: ""
        }
    }

    componentDidMount() {
        if (this.props.progress !== undefined && this.props.progress !== null) {
            this.setState({ progress: this.props.progress });
        }

        if (this.props.uploadMessage !== undefined) {
            this.setState({ uploadMessage: this.props.uploadMessage });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.progress !== undefined && this.props.progress !== prevProps.progress) {
            this.setState({ progress: this.props.progress });
        }

        if (this.props.uploadMessage !== undefined && this.props.uploadMessage !== prevProps.uploadMessage) {
            this.setState({ uploadMessage: this.props.uploadMessage });
        }
    }

    render() {
        return (
            <div className="modal-uploading-video-dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-body">
                            {this.state.uploadMessage !== "" ?
                                <p className="m-30">{this.state.uploadMessage}</p> :
                                this.state.progress === null ? null :
                                    <React.Fragment>
                                        <p className="m-20">{this.state.progress === 100 ? "Upload Completed" : `We are uploading your video...`}</p>
                                        <div className="d-flex justify-content-center mb-30">
                                            {this.state.progress === 100 ? <i className="far fa-check-circle fa-5x"></i>
                                                :
                                                <div className="uploadingVideoBar">
                                                    <div id="completedVideoBar" className="completedVideoBar" style={{ "width": `${this.state.progress}%` }}>{this.state.progress}%</div>
                                                </div>
                                            }
                                        </div>
                                    </React.Fragment>
                            }
                        </div>

                    </div>

                </div>
            </div>
        );
    }
};

import React from "react";

export const VideoUpgradeDialog = (props) => {
    const modalStyle = props.videoUpgradeDiaglogOpened ? "modal modal-videoupgrade-dialog modal-display"
        : "modal modal-hide";

    return (
        <div className={modalStyle}>
            {/* <div className="modal modal-callee-dialog modal-display"> */}
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-body">
                        {/* <button type="button" className="close close-button" onClick={props.handleCloseVideoUpgradeDiaglog} data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button> */}

                        <p className="modal-callee-message m-20">{props.username} is requesting a video call...</p>

                        <div className="d-flex justify-content-center">
                            <button type="button" className="btn btn-danger modal-callee-button" onClick={props.handleVideoUpgradeDecline}>
                                <i className="fas fa-times"></i>
                            </button>

                            <button type="button" className="btn btn-success modal-callee-button" onClick={props.handleVideoUpgradeAccept}>
                                <i className="fas fa-phone-alt"></i>
                            </button>
                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
};

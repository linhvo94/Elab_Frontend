import React from "react";

export const UserDialog = (props) => {
    const modalStyle = props.userDiaglogOpened ? "modal modal-user-dialog modal-display" : "modal modal-hide";

    return (
        <div className={modalStyle}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-body">
                        <button type="button" className="close close-button" onClick={props.handleCloseUserDialog} data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>

                        <p className="modal-callee-message m-20">{props.userSelected}</p>

                        <div className="d-flex justify-content-center">
                            <button type="button" className="btn btn-default userdialog-audio-button" onClick={(e) => props.handleUserSelectedCall(e, true)}>
                                <i className="fas fa-phone-alt"></i>
                            </button>

                            <button type="button" className="btn btn-defaukt userdialog-video-button" onClick={(e) => props.handleUserSelectedCall(e, false)}>
                                <i className="fas fa-video"></i>
                            </button>
                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
};

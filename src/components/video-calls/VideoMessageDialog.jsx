import React from "react";

export const VideoMessageDialog = (props) => {
    const modalStyle = props.videoMessageDialogOpened ? "modal modal-videomessage-dialog modal-display"
        : "modal modal-hide";

    return (
        <div className={modalStyle}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-body">
                        <button type="button" className="close close-button" onClick={props.handleCloseMessageDiaglog} data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>

                        <p className="modal-callee-message m-20">{props.videoMessage}</p>

                    </div>

                </div>
            </div>

        </div>
    );
};

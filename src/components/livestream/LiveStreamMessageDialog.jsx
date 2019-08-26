import React from "react";

export const LiveStreamMessageDialog = (props) => {
    return (
        <div className="modal-livestream-modal-dialog">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h6 className="modal-title">Message</h6>
                        <button type="button" className="close" aria-label="Close" onClick={props.closeMessageDialog}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <p className="m-20">{props.message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

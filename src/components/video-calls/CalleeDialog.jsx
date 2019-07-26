import React from "react";

export const CalleeDialog = (props) => {
    const modalStyle = props.callDiaglogOpened ? "modal modal-callee-dialog modal-display"
        : "modal modal-hide";

    return (
        <div className={modalStyle}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-body">
                        <button type="button" className="close close-button" onClick={props.handleCloseCallDiaglog} data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div className="modal-callee-img">

                        </div>
                        {/* <img className="modal-call-img" src="https://cdn.dribbble.com/users/2424687/screenshots/6509663/learn_anywhere-01_4x.png" alt="calling avatar"/> */}

                        <p className="modal-callee-message m-40">{props.caller} is video calling you...</p>

                        <div className="d-flex justify-content-center">
                            <button type="button" className="btn btn-danger modal-callee-button" onClick={props.handleCallDecline}>
                                <i className="fas fa-times"></i>
                            </button>

                            <button type="button" className="btn btn-success modal-callee-button" onClick={props.handleCallAccept}>
                                <i className="fas fa-phone-alt"></i>
                            </button>
                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
};

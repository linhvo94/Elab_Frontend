import React from "react";

export const SearchUserBox = (props) => {
    const modalStyle = props.searchUserBoxOpened ? "modal modal-search-userbox modal-display" : "modal modal-hide";
    return (
            <div className={modalStyle}>
                <div className="modal modal-search-userbox modal-display">
                    <div className="modal-content">
                        <div className="modal-body">
                            <button type="button" className="close close-button" onClick={props.handleCloseSearchUserBox} data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>

                            <form className="form-search-userbox">
                                <h5 className="mb-3">Select User: </h5>
                                <div className="form-group">
                                    <input className="form-control input-search-userbox" type="text" placeholder="Search..."
                                        name="searchUser" value={props.searchUser} onChange={props.handleChange} />
                                    <div className={props.filterUsers.length <= 3 ? "btn-group-vertical search-userbox-group" : "btn-group-vertical search-userbox-group-scroll"}>
                                        {props.filterUsers.map((user, index) =>
                                            <button key={index} type="button" className="btn btn-default search-userbox-button"
                                                onClick={(e) => props.makeACall(e, user)}> {user} </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                    </div>

                </div>
            </div>
    );
}
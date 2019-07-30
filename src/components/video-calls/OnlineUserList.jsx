import React from "react";

export const OnlineUserList = (props) => {
    const users = ["linh", "ha", "nhi", "nhu", "loc", "toan", "thanh"];
    return (
        <React.Fragment>
            <div className="online-user-list">
                <form>
                    <input type="text" className="form-control" placeholder="&#xf002; Search" />
                    <div className="">
                        {users.map((user, index) =>
                            <li key={index}>
                                <button type="button" className="btn btn-default btn-block">{user}</button>
                            </li>
                        )}
                    </div>
                </form>
            </div>

        </React.Fragment>
    );
}
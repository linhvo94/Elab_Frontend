import React from "react";
import { Link } from "react-router-dom";

export default class Sidebar extends React.Component {
    render() {
        return (
            <div className="media-sidebar">
                <div className="sidebar">
                    <ul>
                        <li><Link to={"/"}><i className="fas fa-home"></i></Link></li>
                        <li><Link to={"/media"}><i className="fas fa-comment-alt"></i></Link></li>
                        <li><Link to={"/conference"}><i className="fas fa-users"></i></Link></li>
                        <li><Link to={"/livestream"}><i className="fas fa-broadcast-tower"></i></Link></li>
                        <li><Link to={"/"} onClick={this.props.logout}><i className="fas fa-sign-out-alt"></i></Link></li>
                    </ul>
                </div>
            </div>
        );
    }
}
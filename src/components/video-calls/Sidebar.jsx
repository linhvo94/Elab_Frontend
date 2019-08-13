import React from "react";
import { Link } from "react-router-dom";

export default class Sidebar extends React.Component {
    render() {
        return (
            <div className="col-1 col-sm-1 col-md-1 col-lg-1 col-xl-1 media-sidebar">
                <div className="sidebar">
                    <ul>
                        <li><Link to={"/"}><i className="fas fa-home"></i></Link></li>
                        <li><Link to={"/media"}><i className="fas fa-comment-alt"></i></Link></li>
                        <li><Link to={"/livestream"}><i className="fas fa-broadcast-tower"></i></Link></li>
                    </ul>
                </div>
            </div>
        );
    }
}
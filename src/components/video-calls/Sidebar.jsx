import React from "react";
import { Link } from "react-router-dom";

export default class Sidebar extends React.Component {
    render () {
        return (
            <div className="sidebar">
                <ul>
                   <li><Link to={"/"}><i className="fas fa-home"></i></Link></li>
                   <li><Link to={"/message"}><i className="fas fa-comment-alt"></i></Link></li>
                   <li><Link to={"/livestream"}><i className="fas fa-broadcast-tower"></i></Link></li> 
                </ul>
            </div>
        );
    }
}
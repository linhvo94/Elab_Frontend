import React from "react";
import { Link } from "react-router-dom";
import elab_logo from "../../media/logos/elab_logo.png";

export default class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            firstName: ""
        }
    }

    componentDidMount() {
        let user = JSON.parse(localStorage.getItem("user"));
        if (user !== undefined && user !== null && user.firstName !== null) {
            this.setState({ firstName: user.firstName });
        }

        let open = document.getElementById('hamburger');
        let changeIcon = true;

        open.addEventListener("click", () => {
            let overlay = document.querySelector(".overlay");
            let nav = document.querySelector("nav");
            let icon = document.querySelector(".menu-toggle i");

            overlay.classList.toggle("menu-open");
            nav.classList.toggle("menu-open");

            if (changeIcon) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-times");
                changeIcon = false;
            } else {
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
                changeIcon = true;
            }
        });
    }

    render() {
        return (
            <div className="header">
                <header>
                    <div className="menu-toggle" id="hamburger">
                        <i className="fas fa-bars"></i>
                    </div>
                    <div className="overlay"></div>
                    <div className="container">
                        <nav>
                            <h1 className="brand-name">
                                <Link className="brand-link" to={"/"}>
                                    <img src={elab_logo} alt="elab-logo" className="responsive" /> <span>E-LAB</span>
                                </Link>
                            </h1>
                            <ul>
                                <li><Link className="nav-link" to={"/home"}>Home</Link></li>
                                <li><Link className="nav-link" to={"/media"}>Media</Link></li>
                                <li><Link className="nav-link" to={"/livestream"}>Livestream</Link></li>
                                {this.props.authenticated === false ?
                                    <li><Link className="btn btn-default nav-login-link" to={"/login"}>Login</Link></li>
                                    : <li>
                                        <div className="dropdown">
                                            <button type="button" className="btn btn-default nav-name-button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                {this.state.firstName !== "" ? this.state.firstName[0] : "Unknown"}
                                            </button>
                                            <div className="dropdown-menu dropdown-menu-right">
                                                <button className="dropdown-item" type="button" onClick={this.props.logout}>
                                                    Signout
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                }
                            </ul>
                        </nav>
                    </div>
                </header>
            </div>
        );
    }
}
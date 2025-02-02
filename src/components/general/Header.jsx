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
        if (this.props.firstName !== undefined && this.props.firstName !== null) {
            this.setState({ firstName: this.props.firstName });
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

    componentDidUpdate(prevProps) {
        if (this.props.firstName !== undefined && this.props.firstName !== null && this.props.firstName !== prevProps.firstName) {
            this.setState({ firstName: this.props.firstName });
        }
    }

    // logout = () => {
    //     this.props.logout();
    //     if (this.props.socket !== undefined && this.props.socket !== null) {
    //         this.props.socket.disconnect();
    //     }
    // }

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
                                <li><Link className="nav-link" to={"/conference"}>Conference</Link></li>
                                <li><Link className="nav-link" to={"/livestream"}>Livestream</Link></li>
                                {this.props.authenticated === false ?
                                    <li><Link className="nav-login-link" to={"/login"}>Login</Link></li>
                                    : <li>
                                        <div className="dropdown">
                                            <button type="button" className="nav-name-button">
                                                {this.state.firstName === null || this.state.firstName === "" ? "Unknown" : this.state.firstName[0]}
                                            </button>
                                            <div className="dropdown-content">
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
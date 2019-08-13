import React from "react";
import { Link } from "react-router-dom";
import { checkLoginValid } from './form-validation.js'

export default class Login extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: "",
            errorMessage: ""
        }
    }

    componentWillReceiveProps(props) {
        if (props.authentication.authenticated) {
            if (props.location.state !== undefined) {
                const { from } = props.location.state;
                props.history.push(from.pathname);
            } else {
                props.history.push("/");
            }
        } else {
            this.setState({ errorMessage: props.authentication.errorMessage });
        }

    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

    login = (e) => {
        e.preventDefault();
        let errorMessage = checkLoginValid(this.state.username, this.state.password);
        if (errorMessage === "" || errorMessage === null) {
            this.props.login(this.state)
        } else {
            this.setState({ errorMessage: errorMessage });
        }
    }

    render() {
        return (
            <React.Fragment>
                <div className="login-page">
                    <div className="row justify-content-center login-page-container">
                        <div className="col-xs-0 col-sm-6 col-md-6 login-img"></div>
                        <div className="col-xs-12 col-sm-6 col-md-6 login-form-container">
                            <form className="login-form">
                                <h2 className="login-form-header">Login</h2>
                                <div className="form-group">
                                    <p className="error-message">{this.state.errorMessage}</p>
                                </div>

                                <div className="form-group login-form-input">
                                    <input className="form-control" type="text" placeholder="&#xf007; Username"
                                        name="username" value={this.state.username} onChange={this.handleChange} />

                                </div>
                                <div className="form-group login-form-input">
                                    <input className="form-control" type="text" placeholder="&#xf084; Password"
                                        name="password" value={this.state.password} onChange={this.handleChange} />
                                </div>

                                <button type="button" className="login-button" onClick={this.login}>
                                    Login
                                </button>

                                <div className="form-group">
                                    <Link to={"/signup"} className="signup-form-link">Haven't got an account?</Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
} 
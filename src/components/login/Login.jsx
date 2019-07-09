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
        if(props.authentication.authenticated) {
            props.history.push("/chatting");
        } else {
            this.setState({errorMessage: props.authentication.errorMessage});
        }
        
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

    login = (e) => {
        e.preventDefault();
        let errorMessage = checkLoginValid(this.state.username, this.state.password);
        if(errorMessage === "" || errorMessage === null) {
            this.props.login(this.state)
        } else {
            this.setState({errorMessage: errorMessage});
        }
    }

    render() {
        return (
            <React.Fragment>
                <div className="login-page h-100">
                    <div className="row justify-content-center h-100">
                        <div className="col-md-6 h-100 login-img">
                        </div>
                        <div className="col-md-6 login-form-container">
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
                                {/* <Link to={"/signup"}>Haven't got an account?</Link> */}
                                <div className="form-group">
                                    <a href="/signup" className="login-form-link">Forgot password?</a>
                                </div>

                                <button type="button" className="btn btn-default login-button" onClick={this.login}>
                                    Login
                                </button>

                                <div className="form-group">
                                    <a href="/signup" className="login-form-link">Haven't got an account?</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
} 
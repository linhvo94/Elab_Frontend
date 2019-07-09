import React from "react";
import { checkSignupValid } from "./form-validation.js"

export default class Signup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: "",
            email: "",
            lastName: "",
            firstName: "",
            months: ["January", "February", "March", "April", "May",
                "June", "July", "August", "September", "October",
                "November", "December"],
            month: "",
            day: "",
            year: "",
            error: ""
        }
    }

    componentWillReceiveProps(props) {
        let error = {};
        if (props.registration.errorMessage !== "") {
            if (props.registration.errorMessage.includes("Username")) {
                error["username"] = props.registration.errorMessage;
                this.setState({ error: error });
            } else if (props.registration.errorMessage.includes("Password")) {
                error["password"] = props.registration.errorMessage;
                this.setState({ error: error });
            } else {
                error["unexpected"] = props.registration.errorMessage;
                this.setState({ error: error });
            }
        }
    }

    handleChange = (e) => {
        e.preventDefault();
        this.setState({ [e.target.name]: e.target.value });
    }


    isInputValue = () => {
        let { firstName, lastName, username, password, email, day, month, year, error } = this.state;
        error = "";
        error = checkSignupValid(firstName, lastName, username, password, email, day, month, year);
        this.setState({ error: error });
        if (error === "" || error === null) {
            return true;
        } else {
            return false;
        }
    }

    signup = (e) => {
        e.preventDefault();
        if (this.isInputValue()) {
            let { year, month, day } = this.state;
            let intMonth = this.state.months.indexOf(month);
            intMonth += 1
            let dob = intMonth < 10 ? `${year}-0${intMonth}-${day}` : `${year}-${intMonth}-${day}`;

            this.props.signup({
                username: this.state.username,
                password: this.state.password,
                email: this.state.email,
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                dob: dob
            });
        }
    }

    render() {
        return (
            <React.Fragment>
                <div className="login-page h-100">
                    <div className="row justify-content-center h-100">
                        <div className="col-md-6 signup-form-container">
                            <form className="signup-form">
                                <h2 className="signup-form-header">Signup</h2>
                                <div className="form-group">
                                    <p className="error-message">{this.state.error["unexpected"]}</p>
                                </div>

                                <div className="form-group signup-form-input">
                                    <input className="form-control" type="text" placeholder="First name"
                                        name="firstName" value={this.state.firstName} onChange={this.handleChange} />

                                    <p className="error-message">{this.state.error["firstName"]}</p>
                                </div>
                                <div className="form-group signup-form-input">
                                    <input className="form-control" type="text" placeholder="Last Name"
                                        name="lastName" value={this.state.lastName} onChange={this.handleChange} />
                                    <p className="error-message">{this.state.error["lastName"]}</p>
                                </div>

                                <div className="form-inline signup-form-input">
                                    <div className="form-group">
                                        <div className="input-group">
                                            <select className="custom-select" name="month" value={this.state.month} onChange={this.handleChange}>
                                                <option defaultValue value="">Month</option>
                                                {this.state.months.map((month, index) =>
                                                    <option key={index} value={month}>{month}</option>
                                                )}
                                            </select>

                                        </div>

                                        <input className="form-control signup-birthday-input" maxLength="2" size="2" type="text" placeholder="Day"
                                            name="day" value={this.state.day} onChange={this.handleChange} />



                                        <input className="form-control signup-birthday-input" maxLength="4" size="4" type="text" placeholder="Year"
                                            name="year" value={this.state.year} onChange={this.handleChange} />

                                    </div>
                                    <p className="error-message">{this.state.error["dob"]}</p>
                                </div>


                                <div className="form-group signup-form-input">
                                    <input className="form-control" type="text" placeholder="Username"
                                        name="username" value={this.state.username} onChange={this.handleChange} />
                                    <p className="error-message">{this.state.error["username"]}</p>

                                </div>
                                <div className="form-group signup-form-input">
                                    <input className="form-control" type="text" placeholder="Password"
                                        name="password" value={this.state.password} onChange={this.handleChange} />
                                    <p className="error-message">{this.state.error["password"]}</p>
                                </div>
                                <div className="form-group signup-form-input">
                                    <input className="form-control" type="text" placeholder="Email"
                                        name="email" value={this.state.email} onChange={this.handleChange} />
                                    <p className="error-message">{this.state.error["email"]}</p>
                                </div>

                                <div className="form-group">
                                    <a href="/signup" className="signup-form-link">Forgot password?</a>
                                </div>

                                <button type="button" className="btn btn-default signup-button" onClick={this.signup}>
                                    Signup
                                </button>

                                <div className="form-group">
                                    <a href="/signup" className="signup-form-link">Haven't got an account?</a>
                                </div>
                            </form>
                        </div>

                        <div className="col-md-6 h-100 signup-img">

                        </div>
                    </div>

                </div>

            </React.Fragment>
        )
    }
}
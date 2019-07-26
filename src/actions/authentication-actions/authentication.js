import {
    LOGIN_SUCCESSFULLY, BAD_CREDENTIALS, SERVER_ERRORS, SIGNUP_SUCCESSFULLY, BAD_REQUEST, USERNAME_TAKEN

} from "../../action-types/authentication-types.js";

export function login(user) {
    return (dispatch) => {
        fetch(`https://www.e-lab.live:8080/api/oauth/token?grant_type=password&username=${user.username}&password=${user.password}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    'Authorization': 'Basic Y2xpZW50LWlkOnNlY3JldA=='
                },
                method: "POST"
            })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                } else if (res.status === 400) {
                    console.log("invalid")
                    dispatch({
                        type: BAD_CREDENTIALS,
                        payload: "Username or password is not correct"
                    });
                    return "";
                } else {
                    dispatch({
                        type: SERVER_ERRORS,
                        payload: "Unexpected errors have occured"
                    });
                    return "";
                }
            })
            .then(data => {
                if (data !== "") {
                    sessionStorage.setItem("access_token", data.access_token);
                    sessionStorage.setItem("expires_in", data.expires_in);
                    sessionStorage.setItem("refresh_token", data.refresh_token);
                    sessionStorage.setItem("scope", data.scope);
                    sessionStorage.setItem("user", JSON.stringify(data.user));
                    dispatch({
                        type: LOGIN_SUCCESSFULLY,
                        payload: ""
                    });
                }
            })
    }
}

export function signup(user) {
    var status = ""
    return (dispatch) => {
        fetch("http://localhost:8080/create-student-account",
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                method: "POST",
                body: JSON.stringify(user)
            })
            .then(res => {
                if (res.status === 200) {
                    status = 200;
                    return null;
                } else if (res.status === 400) {
                    status = 400;
                    return res.text();
                } else if (res.status === 409) {
                    status = 409;
                    return res.text();
                }
            })
            .then((data) => {
                if (status === 200) {
                    dispatch({
                        type: SIGNUP_SUCCESSFULLY
                    });
                } else if (status === 400) {
                    dispatch({
                        type: BAD_REQUEST,
                        payload: data
                    });
                } else if (status === 409) {
                    dispatch({
                        type: USERNAME_TAKEN,
                        payload: data
                    });
                } else {
                    dispatch({
                        type: SERVER_ERRORS,
                        payload: "Unexpected errors have occured"
                    })
                }
            })
    }
} 
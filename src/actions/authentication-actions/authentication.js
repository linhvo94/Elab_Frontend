import {
    LOGIN_SUCCESSFULLY, BAD_CREDENTIALS, SERVER_ERRORS, SIGNUP_SUCCESSFULLY, BAD_REQUEST, USERNAME_TAKEN,
    LOGOUT_SUCCESSFULLY

} from "../../action-types/authentication-types.js";

export function login(user) {
    return (dispatch) => {
        // https://www.e-lab.live:8080/api/oauth/token?grant_type=password&username=${user.username}&password=${user.password}
        // http://localhost:8080/oauth/token?grant_type=password&username=${user.username}&password=${user.password}
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
                if (data !== "" && data !== null) {
                    localStorage.setItem("access_token", data.access_token);
                    localStorage.setItem("expires_in", data.expires_in);
                    localStorage.setItem("refresh_token", data.refresh_token);
                    localStorage.setItem("scope", data.scope);
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("user_roles", JSON.stringify(data.user_roles));

                    dispatch({
                        type: LOGIN_SUCCESSFULLY,
                        payload: data.user
                    });
                }
            })
    }
}

export function signup(user) {
    var status = ""
    return (dispatch) => {
        fetch("https://www.e-lab.live:8080/api/create-student-account",
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
                    return res.json();
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
                    dispatch(login(user));
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
            .catch(e => {
                dispatch({
                    type: SERVER_ERRORS,
                    payload: "Unexpected errors have occured"
                })
            })
    }
}

export function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("user_roles");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("scope");
    localStorage.removeItem("expires_in");
    return {
        type: LOGOUT_SUCCESSFULLY
    }
}
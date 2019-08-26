import { FETCH_ALL_USERS_SUCCESSFULLY } from "../../action-types/user-types";


export function fetchAllUsers () {
    let access_token = localStorage.getItem("access_token");
    return (dispatch) => {
        fetch(`https://www.e-lab.live:8080/api/get-users?access_token=${access_token}`)
            .then((res) => { return res.json() })
            .then((data) => {
                dispatch({
                    type: FETCH_ALL_USERS_SUCCESSFULLY,
                    payload: data
                })
            })
    }
}
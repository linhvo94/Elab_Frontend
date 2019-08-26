import {

    LOGIN_SUCCESSFULLY, BAD_CREDENTIALS, SERVER_ERRORS, LOGOUT_SUCCESSFULLY

} from "../../action-types/authentication-types.js";

const initialState = {
    authenticated: false,
    authorized: false,
    user: null,
    errorMessage: ""
}


export const authentication = (state = initialState, action) => {
    switch (action.type) {
        case LOGIN_SUCCESSFULLY:
            return {
                ...state,
                authenticated: true,
                user: action.payload,
                errorMessage: ""
            }
        case BAD_CREDENTIALS:
            return {
                ...state,
                authenticated: false,
                user: null,
                errorMessage: action.payload
            }
        case SERVER_ERRORS:
            return {
                ...state,
                authenticated: false,
                user: null,
                errorMessage: action.payload
            }
        case LOGOUT_SUCCESSFULLY:
            return {
                ...state,
                authenticated: false,
                user: null,
                errorMessage: ""
            }
        default:
            return state;
    }
}

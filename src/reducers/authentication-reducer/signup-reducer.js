import { SIGNUP_SUCCESSFULLY, BAD_REQUEST, USERNAME_TAKEN, SERVER_ERRORS } from "../../action-types/authentication-types.js";

const initialState = {
    successfulSignup: false,
    errorMessage: ""
}


export const registration = (state = initialState, action) => {
    switch (action.type) {
        case SIGNUP_SUCCESSFULLY:
            return {
                ...state,
                successfulSignup: true,
                errorMessage: ""
            }
        case BAD_REQUEST:
            return {
                ...state,
                successfulSignup: false,
                errorMessage: action.payload
            }
        case USERNAME_TAKEN:
            return {
                ...state,
                successfulSignup: false,
                errorMessage: action.payload
            }
        case SERVER_ERRORS:
            return {
                ...state,
                successfulSignup: false,
                errorMessage: action.payload
            }
        default:
            return state
    }
}
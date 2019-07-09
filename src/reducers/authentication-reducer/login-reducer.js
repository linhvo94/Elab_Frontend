import {LOGIN_SUCCESSFULLY, BAD_CREDENTIALS, SERVER_ERRORS } from "../../action-types/authentication-types.js";


const initialState = {
    authenticated: false,
    authorized: false,
    errorMessage: ""
}


export const authentication = (state = initialState, action) => {
    switch(action.type) {
        case LOGIN_SUCCESSFULLY:
            return {
                ...state,
                authenticated: true,
                errorMessage: ""
            }
        case BAD_CREDENTIALS:
            return {
                ...state,
                authenticated: false,
                errorMessage: action.payload
            }
        case SERVER_ERRORS: 
            return {
                ...state,
                authenticated: false,
                errorMessage: action.payload
            }
        default:
            return state;
    }
}
    
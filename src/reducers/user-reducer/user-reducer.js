import { FETCH_ALL_USERS_SUCCESSFULLY } from "../../action-types/user-types";


const initialState = {
    users: [],
    errorMessage: ""
}


export const user = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ALL_USERS_SUCCESSFULLY:
            return {
                ...state,
                users: action.payload
            }
        default:
            return state;
    }
}
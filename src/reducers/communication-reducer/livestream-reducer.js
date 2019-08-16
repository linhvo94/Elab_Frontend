import { 
    FETCH_ALL_LIVESTREAMS_SUCCESSFULLY, CREATE_ROOM_SUCCESSFULLY,
    FETCH_A_LIVESTREAM_SUCCESSFULLY, LIVESTREAM_NOT_FOUND

} from "../../action-types/livestream-types";

const initialState = {
    livestreams: null,
    livestream: null,
    roomCreated: false,
    errorMessage: ""
}

export const livestreams = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ALL_LIVESTREAMS_SUCCESSFULLY:
            return {
                ...state,
                livestreams: action.payload,
                errorMessage: ""
            }
        case CREATE_ROOM_SUCCESSFULLY: 
            return {
                ...state,
                roomCreated: action.payload,
                errorMessage: "",
            }
        case FETCH_A_LIVESTREAM_SUCCESSFULLY: 
            return {
                ...state,
                livestream: action.payload,
                errorMessage: "",
            }
        case LIVESTREAM_NOT_FOUND:
            return {
                ...state,
                livestream: null,
                errorMessage: action.payload
            }
        default:
            return state;
    }
}



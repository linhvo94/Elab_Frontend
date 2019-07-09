import { CONNECT_TO_SIGNALING_SERVER_SUCCESSFULLY} from '../../action-types/calling-types.js';

const initialState = {
    callee: {},
    loading: false,

}

export const calling = (state = initialState, action) => {
    switch (action.type) {
        case CONNECT_TO_SIGNALING_SERVER_SUCCESSFULLY:
            console.log("Successful connection");
            break;
        default:
            return state;
    }
}
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { calling } from "./reducers/communication-reducer/calling-reducer.js";
import { authentication } from "./reducers/authentication-reducer/login-reducer.js";
import { registration } from "./reducers/authentication-reducer/signup-reducer.js";
import { livestreams } from "./reducers/communication-reducer/livestream-reducer.js";
import thunk from "redux-thunk";
import Root from "./Root.jsx";
import { loadState, saveState } from "./localStorage.js";


const persistedState = loadState();

const store = createStore(
    combineReducers({ calling, authentication, registration, livestreams }), persistedState
    , applyMiddleware(thunk));

store.subscribe(() => {
    saveState({ authentication: store.getState().authentication })
});

ReactDOM.render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.getElementById('root')
);


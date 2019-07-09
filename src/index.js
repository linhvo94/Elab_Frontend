import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { calling } from "./reducers/communication-reducer/calling-reducer.js";
import { authentication } from "./reducers/authentication-reducer/login-reducer.js";
import { registration } from "./reducers/authentication-reducer/signup-reducer.js"
import thunk from "redux-thunk";
import Root from "./Root.jsx";

const store = createStore(
            combineReducers({ calling, authentication, registration })
        , applyMiddleware(thunk));

ReactDOM.render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.getElementById('root')
);


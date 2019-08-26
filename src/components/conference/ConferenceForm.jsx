import React from "react"

export default class ConferenceForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOnCall: false
        }
    }

    componentDidMount() {
        if (this.props.isOnCall !== undefined && this.props.isOnCall !== null) {
            this.setState({ isOnCall: this.props.isOnCall });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.isOnCall !== undefined && this.props.isOnCall !== null
            && this.props.isOnCall !== prevProps.isOnCall) {
            this.setState({ isOnCall: this.props.isOnCall });
        }
    }

    render() {
        return (
            <React.Fragment>
                <div className="conference-form-header">
                    <h5>Add people to your group call</h5>
                </div>

                <div className="conference-form-create">
                    <ul>
                        {this.props.conferenceUsers === undefined || Object.keys(this.props.conferenceUsers) === 0 ? null :
                            Object.keys(this.props.conferenceUsers).map((userKey, index) =>
                                <li key={index}>
                                    <div>
                                        {this.props.conferenceUsers[userKey].firstName}
                                    </div>

                                    <button onClick={(e) => this.props.handleRemoveUserFromConference(e, userKey)} className="btn-rm-user" type="button">
                                        Remove
                                    </button>

                                </li>
                            )}

                    </ul>
                </div>
                <div className="conference-form-call-buttons">
                    <button onClick={this.props.handleCall} disabled={(this.props.conferenceUsers !== undefined
                        && this.props.conferenceUsers !== null
                        && Object.keys(this.props.conferenceUsers).length > 0)
                        && !this.state.isOnCall ? false : true}>Start Group Call
                    </button>
                </div>
            </React.Fragment>
        )
    }
}
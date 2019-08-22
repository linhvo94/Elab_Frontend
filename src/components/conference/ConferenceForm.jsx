import React from "react"

export default class ConferenceForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
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
                        {this.props.conferenceUsers === undefined && this.props.conferenceUsers === null ? null :
                            this.props.conferenceUsers.map((user, index) =>
                                <li key={index}>
                                    <div>
                                        {user}
                                    </div>

                                    <button onClick={(e) => this.props.handleRemoveUserFromConference(e, user)} className="btn-rm-user" type="button">
                                        Remove
                                    </button>

                                </li>
                            )}
                    </ul>
                </div>
                <div className="conference-form-call-buttons">
                    <button onClick={this.props.handleCall} disabled={this.props.conferenceUsers !== undefined && this.props.conferenceUsers !== null && this.props.conferenceUsers.length > 0 ? false : true }>Start Group Call</button>
                </div>
            </React.Fragment>
        )
    }
}
import React from "react";
import { Link } from "react-router-dom";
import Janus from "../../janus-utils/janus.js";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";

export default class MediaUI extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            livestreams: []
        }
    }

    componentDidMount() {
        this.props.fetchAllLiveStreams();
    }

    componentDidUpdate(prevProps) {

        if (this.props.livestreams !== undefined && this.props.livestreams !== null) {
            if (this.props.livestreams !== prevProps.livestreams) {
                this.setState({ livestreams: this.props.livestreams });
                console.log(this.props.livestreams);
            }
        }
    }


    handleChange = (e) => {

    }



    render() {
        return (
            <div className="col-11 livestream-container">
                <div className="livestream-create-header">
                    <input type="text" className="form-control" placeholder="Search" />
                    <Link className="create" to={`${this.props.match.url}/create`}><i className="fas fa-plus"></i> Publish Stream </Link>
                </div>
                <ul>
                    {this.state.livestreams.map((livestream, index) =>
                        <li key={index}>
                            <div className="card">
                                <img className="card-img-top" src="https://cdn.dribbble.com/users/407431/screenshots/4281480/education.jpg" alt="Card cap" />
                                <div className="card-body">
                                    <h5 class="card-title">{livestream.title}</h5>
                                    <p class="card-text">{livestream.description}</p>
                                    <Link to={`${this.props.match.url}/${livestream.roomID}`}>Watch Now</Link>
                                </div>
                            </div>
                        </li>

                    )}
                </ul>
            </div>
        )
    }
}
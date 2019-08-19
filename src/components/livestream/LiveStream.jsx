import React from "react";
import { Link } from "react-router-dom";
import Janus from "../../utils/janus-utils/janus.js";
import { initJanus } from "../../actions/livestream-actions/livestreaming.js";

export default class LiveStream extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            livestreams: [],
            filterLiveStreams: [],
            searchLiveStream: ""
        }
    }

    componentDidMount() {
        this.props.fetchAllLiveStreams();
    }

    componentDidUpdate(prevProps) {
        if (this.props.livestreams !== undefined && this.props.livestreams !== null) {
            if (this.props.livestreams !== prevProps.livestreams) {
                this.setState({ livestreams: this.props.livestreams, filterLiveStreams: this.props.livestreams });
                console.log(this.props.livestreams);
            }
        }
    }


    handleChange = (e) => {
        e.preventDefault();
        this.setState({ [e.target.name]: e.target.value });
        if (e.target.name === "searchLiveStream") {
            if (e.target.value !== null && e.target.value !== "") {
                let filterLiveStreams = this.state.livestreams.filter(livestream => ((livestream.title).toLowerCase()).includes((e.target.value).toLowerCase()));
                this.setState({ filterLiveStreams: filterLiveStreams });

            } else {
                this.setState({ filterLiveStreams: this.state.livestreams });
            }
        }
    }

    filterLiveStreams = (e, type) => {
        e.preventDefault();
        if (type === "all") {
            this.setState({ filterLiveStreams: this.state.livestreams });
        } else {
            let liveStreams = this.state.livestreams.filter(l => l.status === type);
            this.setState({ filterLiveStreams: liveStreams });
        }
    }

    render() {
        return (
            <div className="livestream-container">
                <div className="livestream-create-header">
                    <input type="text" className="form-control" placeholder="Search"
                        name="searchLiveStream" value={this.state.searchLiveStream} onChange={this.handleChange} />
                    <Link className="create" to={"create-stream"}><i className="fas fa-plus"></i> Publish Stream </Link>

                </div>

                <div className="livestream-filters">
                    <button className="" onClick={(e) => this.filterLiveStreams(e, "all")}> Show all</button>
                    <button className="" onClick={(e) => this.filterLiveStreams(e, "live")}> Live </button>
                    <button className="" onClick={(e) => this.filterLiveStreams(e, "created")}> Upcoming </button>
                    <button className="" onClick={(e) => this.filterLiveStreams(e, "ended")}> Past </button>
                </div>

                <div className="livestream-list">
                    <ul>
                        {this.state.filterLiveStreams === null ? null :
                            this.state.filterLiveStreams.map((livestream, index) =>
                                <li key={index}>
                                    <div className="card">
                                        <img className="card-img-top" src="https://cdn.dribbble.com/users/407431/screenshots/4281480/education.jpg" alt="Card cap" />
                                        <div className="card-body">
                                            <h5 className="card-title">{livestream.title}</h5>
                                            <p className="card-text"><i>{livestream.description === "" || livestream.description === null ? "No description" : livestream.description}</i></p>
                                            <p className="card-status">{livestream.status === "" || livestream.status === null ? "Unknown Status" :
                                                livestream.status === "live" ? <span><i className="fas fa-wave-square"></i> On going</span> :
                                                    livestream.status === "ended" ? <span><i className="far fa-file-video"></i> Past</span> :
                                                        livestream.status === "created" ? <span><i className="far fa-calendar-alt"></i> Upcoming</span> :
                                                            "Unknown status"
                                            }</p>
                                            <Link to={`${this.props.match.url}/${livestream.id}`}>Watch Now</Link>
                                        </div>
                                    </div>
                                </li>
                            )}
                    </ul>
                </div>
            </div>
        )
    }
}
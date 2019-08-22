import React from 'react';

export default class Video extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const { srcObject } = this.props;
        if (this.video.srcObject !== srcObject) {
            this.video.srcObject = srcObject;
        }
    }

    componentDidUpdate() {
        const { srcObject } = this.props;
        if (this.video.srcObject !== srcObject) {
            this.video.srcObject = srcObject;
        }
    }

    render() {
        const { srcObject, ...rest } = this.props;
        return (
            <video ref={(video) => { this.video = video; }} />
        );
    }
}
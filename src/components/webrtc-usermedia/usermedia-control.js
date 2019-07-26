export const hasUserMedia = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const handleGetUserMedia = (mediaContraints) => {
    console.log("media constraints", mediaContraints);
    return new Promise((resolve) => {
        if (hasUserMedia()) {
            navigator.mediaDevices.getUserMedia(mediaContraints)
                .then(stream => {
                    resolve(stream);
                })
                .catch(e => console.log(e));
        } else {
            alert("Your browser does not support WebRTC. Please try different browser.");
        }
    });
};

export const handleGetVideoTracks = () => {
    return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            resolve(stream.getVideoTracks());
        })
    });
}
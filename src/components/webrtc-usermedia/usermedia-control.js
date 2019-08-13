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
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                resolve(stream.getVideoTracks());
            })
            .catch(e => {
                console.log(e);
                reject(e);
            });
    });
}

export const handleGetAudioTracks = () => {
    return new Promise((resolve, reject) => {
        if (hasUserMedia()) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    resolve(stream.getAudioTracks());
                })
                .catch(e => {
                    console.log(e);
                    reject(e);
                })
        }
    });
}

export const handleGetScreenTracks = () => {
    return new Promise((resolve, reject) => {
        if (navigator.getDisplayMedia) {
            resolve(navigator.getDisplayMedia({ video: true }));
        } else if (navigator.mediaDevices.getDisplayMedia) {
            resolve(navigator.mediaDevices.getDisplayMedia({ video: true }));
        } else {
            resolve(navigator.mediaDevices.getUserMedia({ video: { mediaSource: "screen" } }));
        }
    });
}
export const VIDEO_CALL_SIGNAL = "video_call_signal";

export const sendVideoOffer = (socket, sender, receiver, isAudioCall, sdp) => {
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "video-offer",
        sender: sender,
        receiver: receiver,
        isAudioCall: isAudioCall,
        sdp: sdp
    });
};

export const sendVideoAnswer = (socket, sender, receiver, socketOrigin, sdp) => {
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "video-answer",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin,
        sdp: sdp
    });
};

export const sendVideoDeclineEvent = (socket, sender, receiver, socketOrigin) => {
    console.log("declineeeeeeeeeeeeeee..........., sender: ", sender);
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "video-decline",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin
    });
}

export const sendVideoPickedUpEvent = (socket, sender, receiver) => {
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "video-picked-up",
        sender: sender,
        receiver: receiver
    });
};

export const sendVideoHangupEvent = (socket, sender, receiver) => {
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "video-hangup",
        sender: sender,
        receiver: receiver
    });
};

export const sendAddOnlineUserEvent = (socket, username) => {
    socket.emit("add_online_user", username);
};

export const sendNewIceCandidate = (socket, sender, receiver, socketOrigin, candidate) => {
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "new-ice-candidate",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin,
        candidate: candidate
    });
}

export const sendVideoUpgrade = (socket, sender, receiver, socketOrigin, sdp) => {
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "video-upgrade",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin,
        sdp: sdp
    });
};

export const sendVideoUpgradeDecline = (socket, sender, receiver, socketOrigin) => {
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "upgrade-video-decline",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin
    });
};








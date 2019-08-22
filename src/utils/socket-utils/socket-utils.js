export const VIDEO_CALL_SIGNAL = "video_call_signal";
export const CONFERENCE_CALL_SIGNAL = "conference_signal";

export const sendVideoOffer = (socket, sender, receiver, isAudioCall, sdp) => {
    console.log("Offer", sender, receiver);
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

export const sendOfferChangingEvent = (socket, sender, receiver, socketOrigin, sdp) => {
    console.log(sender, receiver, socketOrigin)
    socket.emit(VIDEO_CALL_SIGNAL, {
        type: "video-offer-changing",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin,
        sdp: sdp
    });
}

export const sendConferenceOffer = (socket, sender, receiver, roomID) => {
    socket.emit(CONFERENCE_CALL_SIGNAL, {
        type: "conference-offer",
        sender: sender,
        receiver: receiver,
        room: roomID
    });
}

export const sendConferenceAnswer = (socket, sender, receiver, socketOrigin) => {
    socket.emit(CONFERENCE_CALL_SIGNAL, {
        type: "conference-answer",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin
    });
}

export const sendConferenceDeclineEvent = (socket, sender, receiver, socketOrigin) => {
    socket.emit(CONFERENCE_CALL_SIGNAL, {
        type: "conference-decline",
        sender: sender,
        receiver: receiver,
        socketOrigin: socketOrigin
    });
}

export const sendConferenceHangupEvent = (socket, sender, receiver) => {
    socket.emit(CONFERENCE_CALL_SIGNAL, {
        type: "conference-hangup",
        sender: sender,
        receiver: receiver
    });
};

export const sendConferencePickedUpEvent = (socket, sender, receiver) => {
    socket.emit(CONFERENCE_CALL_SIGNAL, {
        type: "conference-picked-up",
        sender: sender,
        receiver: receiver
    });
};

export const sendConferenceLeavingEvent = (socket, sender) => {
    socket.emit(CONFERENCE_CALL_SIGNAL, {
        type: "conference-leave",
        sender: sender
    });
}









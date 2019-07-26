export const playRingTone = (ringTone) => {
    ringTone.loop = true;
    ringTone.play();
}

export const stopRingTone = (ringTone) => {
    ringTone.pause();
    ringTone.currentTime = 0;
}
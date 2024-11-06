import type { Uint8 } from "../types.ts";

/**
 * Current value of the delay timer (60Hz)
 * @type {Uint8}
 */
let delayTimer: Uint8 = 0;

/**
 * Current value of the sound timer (60Hz)
 * @type {Uint8}
 */
let soundTimer: Uint8 = 0;

/**
 * Decrements both timers if they are greater than 0
 * Should be called at 60Hz
 */
const decrementTimers = (): void => {
    if (delayTimer > 0) delayTimer--;
    if (soundTimer > 0) soundTimer--;
};

/**
 * Sets the delay timer value, clamped to Uint8 range [0, 255]
 * @param {Uint8} value - The value to set the delay timer to
 */
const setDelayTimer = (value: Uint8): void => {
    delayTimer = Math.max(0, Math.min(255, value));
};

/**
 * Sets the sound timer value, clamped to Uint8 range [0, 255]
 * @param {Uint8} value - The value to set the sound timer to
 */
const setSoundTimer = (value: Uint8): void => {
    soundTimer = Math.max(0, Math.min(255, value));
};

/**
 * Gets the current value of the delay timer
 * @returns {Uint8} Current delay timer value
 */
const getDelayTimer = (): Uint8 => {
    return delayTimer;
};

/**
 * Gets the current value of the sound timer
 * @returns {Uint8} Current sound timer value
 */
const getSoundTimer = (): Uint8 => {
    return soundTimer;
};

export {
    decrementTimers,
    getDelayTimer,
    getSoundTimer,
    setDelayTimer,
    setSoundTimer,
};

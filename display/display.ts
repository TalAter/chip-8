import { Bit } from "../types.ts";

const WIDTH = 64;
const HEIGHT = 32;
const PX_ON = "█";
const PX_OFF = "░";
const CLEAR_SCREEN = "\x1Bc";
const RESET_CURSOR = "\u001B[H";
const HIDE_CURSOR = "\u001B[?25l";
const SHOW_CURSOR = "\u001B[?25h";

// @TODO: Optimize so that each byte stores 8 pixels
const displayState = new Uint8Array(WIDTH * HEIGHT);

const translateCoordinates = (x: number, y: number): number => {
    return x + y * WIDTH;
};

const getPixel = (x: number, y: number): Bit => {
    return displayState[translateCoordinates(x, y)] as Bit;
};

const setPixel = (x: number, y: number, state: Bit): void => {
    displayState[translateCoordinates(x, y)] = state;
};

const clear = (): void => {
    displayState.fill(0);
};

const init = (): void => {
    console.log(CLEAR_SCREEN);
};

const render = (): void => {
    let output = HIDE_CURSOR + RESET_CURSOR;
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (getPixel(x, y)) {
                output += PX_ON;
            } else {
                output += PX_OFF;
            }
        }
        output += "\r\n";
    }
    output += SHOW_CURSOR;
    console.log(output);
};

export { clear, getPixel, init, render, setPixel };
export { HEIGHT, WIDTH };

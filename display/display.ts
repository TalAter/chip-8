const WIDTH = 64;
const HEIGHT = 32;
const PX_ON = "█";
const PX_OFF = "░";
const CLEAR_SCREEN = "\x1Bc";

const displayState = new Uint8Array(WIDTH * HEIGHT);

const translateCoordinates = (x: number, y: number): number => {
    return x + y * WIDTH;
};

const getPixel = (x: number, y: number): boolean => {
    return Boolean(displayState[translateCoordinates(x, y)]);
};

const setPixel = (x: number, y: number, state: boolean): void => {
    displayState[translateCoordinates(x, y)] = +state;
};

const clear = (): void => {
    displayState.fill(0);
};

const render = (): void => {
    let output = "";
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
    console.log(CLEAR_SCREEN);
    console.log(output);
};

export { clear, getPixel, render, setPixel };
export { HEIGHT, WIDTH };

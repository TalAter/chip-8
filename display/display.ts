const WIDTH = 64;
const HEIGHT = 32;
const PX_ON = "█";
const PX_OFF = "·";

const displayState = new Uint8Array(WIDTH * HEIGHT);

const translateCoordinates = (x: number, y: number): number => {
    return x + y * WIDTH;
};

const getPixel = (x: number, y: number): boolean => {
    return Boolean(displayState[translateCoordinates(x, y)]);
};

const setPixel = (x: number, y: number, state: boolean): boolean => {
    displayState[translateCoordinates(x, y)] = +state;
    return true;
};

const render = (): boolean => {
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
    console.log(output);
    return true;
};

export { render };

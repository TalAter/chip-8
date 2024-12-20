import { Bit, Uint4 } from "../types.ts";

interface KeypadScancodeDictionary {
    [key: number]: number;
}

let keyPressed: Uint4 | undefined;

const keypadScancodeDictionary: KeypadScancodeDictionary = {
    // Row 1
    49: 0x01, // 1
    50: 0x02, // 2
    51: 0x03, // 3
    52: 0x0C, // 4
    // Row 2
    113: 0x4, // Q
    119: 0x5, // W
    101: 0x6, // E
    114: 0xD, // R
    // Row 3
    97: 0x07, // A
    115: 0x8, // S
    100: 0x9, // D
    102: 0xE, // F
    // Row 4
    122: 0xA, // Z
    120: 0x0, // X
    99: 0x0B, // C
    118: 0xF, // V
};

const init = (): void => {
    // Enable raw mode for stdin to capture keypresses immediately
    Deno.stdin.setRaw(true, { cbreak: true });
};

const handleKeyPresses = async (): Promise<void> => {
    const buffer = new Uint8Array(1);
    const bytesRead = await Deno.stdin.read(buffer);

    if (bytesRead === null || bytesRead === 0) return;
    if (bytesRead === 1) {
        const keyCode = buffer[0];
        if (keyCode in keypadScancodeDictionary) {
            keyPressed = keypadScancodeDictionary[keyCode];
            setTimeout(() => keyPressed = undefined, 100);
        }
        switch (buffer[0]) {
            case 27:
                Deno.exit();
        }
    }
};

const isKeyPressed = (key: Uint4): boolean => {
    const lastPressedKey = keyPressed;
    return lastPressedKey === key;
};

const getPressedKey = (): Uint4 | undefined => {
    const lastPressedKey = keyPressed;
    return lastPressedKey;
};

export { getPressedKey, handleKeyPresses, init, isKeyPressed };

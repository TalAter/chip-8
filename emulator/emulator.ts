import { Bit } from "../types.ts";
import * as cartridge from "../cartridge/cartridge.ts";
import * as memory from "../memory/memory.ts";
import * as display from "../display/display.ts";
import { font } from "../fonts/font.ts";

const CYCLES_PER_SECOND = 700; // 700 Hz
const FRAME_RATE = 60;
const MICROSECONDS_PER_CYCLE = 1_000_000 / CYCLES_PER_SECOND;
const MICROSECONDS_PER_RENDER = 1_000_000 / FRAME_RATE;

const getCurrentTime = (): number => performance.now() * 1000;

const nibbleOpcode = (opcode: number): number[] => [
    (opcode & 0xF000) >> 12,
    (opcode & 0x0F00) >> 8,
    (opcode & 0x00F0) >> 4,
    opcode & 0x000F,
];

const decodeAndExecute = (opcode: number): void => {
    const [nib1, nib2, nib3, nib4] = nibbleOpcode(opcode);
    switch (nib1) {
        case 0:
            // Opcode: 00e0 (clear screen)
            if (opcode === 0x00e0) {
                display.clear();
            } else {
                throw (new Error(`Unknown OPCode ${opcode}`));
            }
            break;
        case 1:
            // Opcode: 1NNN (jump. aka set the Program Counter)
            memory.setPC(opcode & 0x0FFF);
            break;
        case 6:
            // Opcode: 6XNN (sets register X to NN)
            memory.setRegister(nib2, opcode & 0x00FF);
            break;
        case 7:
            // Opcode: 7XNN (adds NN to register X)
            memory.setRegister(
                nib2,
                memory.getRegister(nib2) + opcode & 0x00FF,
            );
            break;
        case 0xA:
            // Opcode: ANNN (sets register I to NNN)
            memory.setRegisterI(opcode & 0x0FFF);
            break;
        case 0xD:
            // Opcode: DXYN (draw sprite to screen)
            // Draw an N pixels tall sprite from the memory location that the I index register is holding to the screen, at the horizontal X coordinate in VX and the Y coordinate in VY
            {
                const x = memory.getRegister(nib2) & (display.WIDTH - 1); //  We binary AND x with WIDTH so it wraps around
                const y = memory.getRegister(nib3) & (display.HEIGHT - 1); // We binary AND y with HEIGHT so it wraps around
                const height = opcode & 0x000f;

                // Set the VF register to 0
                memory.setRegister(0xF, 0);

                // Get sprite from memory and draw it
                const i = memory.getRegisterI();
                for (let row = 0; row < height; row++) {
                    const spriteLine = memory.read(i + row);
                    for (let column = 0; column < 8; column++) {
                        const newState =
                            (spriteLine >> 7 - column & 0x1) as Bit;
                        const oldState = display.getPixel(x + column, y + row);
                        if (newState) {
                            if (oldState) {
                                memory.setRegister(0xF, 1);
                            }
                            display.setPixel(
                                x + column,
                                y + row,
                                (oldState ^ 1) as Bit,
                            );
                        }
                    }
                }
            }
            break;
        default:
            throw (new Error(`Unknown OPCode ${opcode}`));
    }
};

const init = (filename: string): void => {
    memory.storeFont(font);

    const cartridgeData = cartridge.readChip8File(filename);
    memory.storeROM(cartridgeData);
};

const mainLoop = async (): Promise<void> => {
    let accummulatedTime = 0;
    let lastRender = 0;
    let lastCycleTime = getCurrentTime();
    while (true) {
        const currentTime = getCurrentTime();
        accummulatedTime += currentTime - lastCycleTime;
        lastCycleTime = currentTime;

        // Fetch-Decode-Execute
        while (accummulatedTime >= MICROSECONDS_PER_CYCLE) {
            accummulatedTime -= MICROSECONDS_PER_CYCLE;
            const opcode = memory.fetch();
            decodeAndExecute(opcode);
        }

        // Render
        if (currentTime - lastRender >= MICROSECONDS_PER_RENDER) {
            lastRender = getCurrentTime();
            display.render();
        }

        await new Promise((resolve) => setTimeout(resolve, 1));
    }
};

export { decodeAndExecute, init, mainLoop, nibbleOpcode };

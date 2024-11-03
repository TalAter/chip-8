import { Bit, Uint16, Uint4, Uint8 } from "../types.ts";
import { UnknownOpcodeError } from "../errors/errors.ts";
import * as cartridge from "../cartridge/cartridge.ts";
import * as memory from "../memory/memory.ts";
import * as display from "../display/display.ts";
import { font } from "../fonts/font.ts";

const CYCLES_PER_SECOND = 700; // 700 Hz
const FRAME_RATE = 60;
const MICROSECONDS_PER_CYCLE = 1_000_000 / CYCLES_PER_SECOND;
const MICROSECONDS_PER_RENDER = 1_000_000 / FRAME_RATE;

const getCurrentTime = (): number => performance.now() * 1000;

const nibbleOpcode = (opcode: Uint16): Uint4[] => [
    (opcode & 0xF000) >> 12,
    (opcode & 0x0F00) >> 8,
    (opcode & 0x00F0) >> 4,
    opcode & 0x000F,
];

const decodeAndExecute = (opcode: Uint16): void => {
    const [nib1, nib2, nib3, nib4] = nibbleOpcode(opcode);
    switch (nib1) {
        case 0:
            if (opcode === 0x00e0) {
                // Opcode: 00E0 (clear screen)
                display.clear();
            } else if (opcode === 0x00EE) {
                // Opcode: 00EE (return from a subroutine)
                memory.setPC(memory.stackPop());
            } else {
                throw new UnknownOpcodeError(opcode);
            }
            break;
        case 1:
            // Opcode: 1NNN (jump. aka set the Program Counter)
            memory.setPC(opcode & 0x0FFF);
            break;
        case 2:
            // Opcode: 2NNN (calls the subroutine at memory location NNN)
            memory.stackPush(memory.getPC());
            memory.setPC(opcode & 0x0FFF);
            break;
        case 3:
            // Opcode: 3XNN (will skip one instruction if the value in VX is equal to NN)
            if (memory.getRegister(nib2) === (opcode & 0x00FF)) {
                memory.setPC(memory.getPC() + 2);
            }
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
        case 8:
            switch (nib4) {
                case 3:
                    // Opcode: 8XY3 (Sets VX to VX XOR VY)
                    memory.setRegister(
                        nib2,
                        memory.getRegister(nib2) ^ memory.getRegister(nib3),
                    );
                    break;
                default:
                    throw new UnknownOpcodeError(opcode);
            }
            break;
        case 0xA:
            // Opcode: ANNN (sets register I to NNN)
            memory.setRegisterI(opcode & 0x0FFF);
            break;
        case 0xC:
            // Opcode: CXNN
            // 1. Generate random number (0-255)
            // 2. Bitwise AND it with NN
            // 3. Store result in register VX
            {
                // Get a random number between 0-255 (8 bits)
                const random: Uint8 = Math.floor(Math.random() * 256) &
                    // AND it with NN from opcode (lower 8 bits)
                    (opcode & 0x00FF);

                // Store result in register VX
                memory.setRegister(nib2, random);
            }
            break;
        case 0xD:
            // Opcode: DXYN (draw sprite to screen)
            // Draw an N pixels tall sprite from the memory location that the I index register is holding to the screen, at the horizontal X coordinate in VX and the Y coordinate in VY
            {
                const x = memory.getRegister(nib2) & (display.WIDTH - 1); //  We binary AND x with WIDTH so it wraps around
                const y = memory.getRegister(nib3) & (display.HEIGHT - 1); // We binary AND y with HEIGHT so it wraps around
                const height = nib4;

                // Set the VF register to 0
                memory.setRegister(0xF, 0);

                // Get sprite from memory and draw it
                const i = memory.getRegisterI();
                for (
                    let row = 0;
                    row < height && y + row < display.HEIGHT;
                    row++
                ) {
                    const spriteLine = memory.read(i + row);
                    for (
                        let column = 0;
                        column < 8 && x + column < display.WIDTH;
                        column++
                    ) {
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
        case 0xF:
            if (nib3 === 3 && nib4 === 3) {
                // Opcode: FX33 (Store the binary-coded decimal representation of VX at addresses I, I+1, and I+2)
                const number = memory.getRegister(nib2);
                const i = memory.getRegisterI();
                memory.write(
                    i,
                    new Uint8Array([
                        Math.floor(number / 100),
                        Math.floor(number / 10 % 10),
                        number % 10,
                    ]),
                );
            } else if (nib3 === 5 && nib4 === 5) {
                // Opcode: FX55 (Store registers V0 through VX in memory starting at location I)
                const addr = memory.getRegisterI();
                const values = new Uint8Array(nib2 + 1);
                for (let counter = 0; counter <= nib2; counter++) {
                    values[counter] = memory.getRegister(counter);
                }
                memory.write(addr, values);
            } else if (nib3 === 6 && nib4 === 5) {
                // Opcode: FX65 (Fill registers V0 through VX with values from memory at address I through I+X)
                const addr = memory.getRegisterI();
                for (let counter = 0; counter <= nib2; counter++) {
                    memory.setRegister(counter, memory.read(addr + counter));
                }
            } else {
                throw new UnknownOpcodeError(opcode);
            }
            break;
        default:
            throw new UnknownOpcodeError(opcode);
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

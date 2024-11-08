import {
    type Bit,
    type EmulatorConfig,
    type Uint16,
    type Uint4,
    type Uint8,
} from "../types.ts";
import { UnknownOpcodeError } from "../errors/errors.ts";
import * as cartridge from "../cartridge/cartridge.ts";
import * as memory from "../memory/memory.ts";
import * as display from "../display/display.ts";
import { font, FONT_BYTES_PER_CHAR } from "../fonts/font.ts";
import {
    decrementTimers,
    getDelayTimer,
    getSoundTimer,
    setSoundTimer,
} from "../timers/timers.ts";
import { beep } from "../sound/sound.ts";
import { setDelayTimer } from "../timers/timers.ts";
import * as keypad from "../keypad/keypad.ts";

let SYSTEM_CONFIG: EmulatorConfig = {
    implementation: "SUPER-CHIP",
    cyclesPerSecond: 700, // 700 Hz
    frameRate: 60,
};

let MICROSECONDS_PER_CYCLE = 1_000_000 / SYSTEM_CONFIG.cyclesPerSecond;
let MICROSECONDS_PER_RENDER = 1_000_000 / SYSTEM_CONFIG.frameRate;

const config = (conf: Partial<EmulatorConfig>): void => {
    // Only update properties that are defined in conf
    SYSTEM_CONFIG = {
        ...SYSTEM_CONFIG,
        ...conf,
    };
    // recalculate speeds
    MICROSECONDS_PER_CYCLE = 1_000_000 / SYSTEM_CONFIG.cyclesPerSecond;
    MICROSECONDS_PER_RENDER = 1_000_000 / SYSTEM_CONFIG.frameRate;
};

const getCurrentTime = (): number => performance.now() * 1000;

const skipInstruction = (): void => {
    memory.setPC(memory.getPC() + 2);
};

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
                skipInstruction();
            }
            break;
        case 4:
            // Opcode: 4XNN (will skip one instruction if the value in VX is not equal to NN)
            if (memory.getRegister(nib2) !== (opcode & 0x00FF)) {
                skipInstruction();
            }
            break;
        case 5:
            // Opcode: 5XY0 (will skip one instruction if the value in VX equal to VY)
            if (memory.getRegister(nib2) === memory.getRegister(nib3)) {
                skipInstruction();
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
                case 0:
                    // Opcode: 8XY0 (sets VX to value of VY)
                    memory.setRegister(nib2, memory.getRegister(nib3));
                    break;
                case 1:
                    // Opcode: 8XY1 (sets VX to VX OR VY)
                    memory.setRegister(
                        nib2,
                        memory.getRegister(nib2) | memory.getRegister(nib3),
                    );
                    break;
                case 2:
                    // Opcode: 8XY2 (sets VX to VX AND VY)
                    memory.setRegister(
                        nib2,
                        memory.getRegister(nib2) & memory.getRegister(nib3),
                    );
                    break;
                case 3:
                    // Opcode: 8XY3 (Sets VX to VX XOR VY)
                    memory.setRegister(
                        nib2,
                        memory.getRegister(nib2) ^ memory.getRegister(nib3),
                    );
                    break;
                case 4:
                    // Opcode: 8XY4 (VX is set to the value of VX + VY. VF is set to 1 if result larger than 255 else 0)
                    // Only the lowest 8 bits of the result are kept, and stored in Vx.
                    {
                        const result = memory.getRegister(nib2) +
                            memory.getRegister(nib3);
                        if (result > 0xff) {
                            memory.setRegister(0xF, 1);
                        } else {
                            memory.setRegister(0xF, 0);
                        }

                        memory.setRegister(nib2, result & 0xFF);
                    }
                    break;
                case 5:
                    // Opcode: 8XY5 (VX is set to the value of VX - VY. If Vx > Vy, then VF is set to 1, otherwise 0.)
                    {
                        const result = memory.getRegister(nib2) -
                            memory.getRegister(nib3);
                        if (result > 0) {
                            memory.setRegister(0xF, 1);
                        } else {
                            memory.setRegister(0xF, 0);
                        }

                        memory.setRegister(nib2, result & 0xFF);
                    }
                    break;
                case 6:
                    // Opcode: 8XY6 (Shift VX 1 bit to the right)
                    {
                        // The implementation differs between COSMAC VIP and newer systems
                        const valueToShift =
                            SYSTEM_CONFIG.implementation === "COSMAC VIP"
                                ? memory.getRegister(nib3) // Use VY
                                : memory.getRegister(nib2); // Use VX
                        memory.setRegister(0xF, valueToShift & 1);
                        memory.setRegister(nib2, valueToShift >> 1);
                    }
                    break;
                case 0xE: {
                    // Opcode: 8XYE (Shift VX 1 bit to the left)
                    const valueToShift =
                        SYSTEM_CONFIG.implementation === "COSMAC VIP"
                            ? memory.getRegister(nib3)
                            : memory.getRegister(nib2);
                    memory.setRegister(0xF, (valueToShift & 0x80) >> 7);
                    memory.setRegister(nib2, valueToShift << 1);
                    break;
                }
                default:
                    throw new UnknownOpcodeError(opcode);
            }
            break;
        case 9:
            // Opcode: 9XY0 (will skip one instruction if the value in VX is not equal to VY)
            if (memory.getRegister(nib2) !== memory.getRegister(nib3)) {
                skipInstruction();
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
            if (nib3 === 0 && nib4 === 7) {
                // Opcode: FX07 (sets VX to the current value of the delay timer)
                memory.setRegister(nib2, getDelayTimer());
            } else if (nib3 === 1 && nib4 === 5) {
                // Opcode: FX15 (sets the delay timer to the value in VX)
                setDelayTimer(memory.getRegister(nib2));
            } else if (nib3 === 1 && nib4 === 8) {
                // Opcode: FX18 (sets the sound timer to the value in VX)
                setSoundTimer(memory.getRegister(nib2));
            } else if (nib3 === 1 && nib4 === 0xE) {
                // Opcode: FX1E (The index register I will get the value in VX added to it)
                // Adds the value in register VX to register I
                // If result exceeds 0xFFF (12 bits), set I to 1
                const newValue = memory.getRegisterI() +
                    memory.getRegister(nib2);
                memory.setRegisterI(newValue <= 0xfff ? newValue : 1);
            } else if (nib3 === 2 && nib4 === 9) {
                //Opcode: FX29 (Set I to sprite address for hex digit in VX)
                const x = memory.getRegister(nib2) & 0xf;
                memory.setRegisterI(
                    memory.FONT_START + x * FONT_BYTES_PER_CHAR,
                );
            } else if (nib3 === 3 && nib4 === 3) {
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

    keypad.init();

    display.init();
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
            // Run keypress handler in the background
            keypad.handleKeyPresses();

            accummulatedTime -= MICROSECONDS_PER_CYCLE;
            const opcode = memory.fetch();
            decodeAndExecute(opcode);
        }

        // Render
        if (currentTime - lastRender >= MICROSECONDS_PER_RENDER) {
            decrementTimers();
            if (getSoundTimer() > 0) beep();
            lastRender = getCurrentTime();
            display.render();
        }

        await new Promise((resolve) => setTimeout(resolve, 1));
    }
};

export { config, decodeAndExecute, init, mainLoop, nibbleOpcode };

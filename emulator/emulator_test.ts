import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import {
    fetch,
    getPC,
    getRegister,
    getRegisterI,
    read,
    reset,
    resetRegisters,
    setPC,
    setRegister,
    setRegisterI,
    stackLength,
    stackPeek,
    stackReset,
    storeFont,
    storeROM,
} from "../memory/memory.ts";
import { FONT_START, ROM_START } from "../memory/memory.ts";
import * as emulator from "../emulator/emulator.ts";
import { clear, getPixel, setPixel } from "../display/display.ts";
import { font } from "../fonts/font.ts";
import type { Uint8 } from "../types.ts";

describe("nibbleOpcode", () => {
    it("nibbles a 16 bit to four 4 bit nibbles", () => {
        expect(emulator.nibbleOpcode(0x1234)).toEqual([1, 2, 3, 4]);
        expect(emulator.nibbleOpcode(0xf000)).toEqual([15, 0, 0, 0]);
        expect(emulator.nibbleOpcode(0x0f00)).toEqual([0, 15, 0, 0]);
        expect(emulator.nibbleOpcode(0x00f0)).toEqual([0, 0, 15, 0]);
        expect(emulator.nibbleOpcode(0x000f)).toEqual([0, 0, 0, 15]);
    });
});

describe("decodeAndExecute", () => {
    beforeEach(() => {
        resetRegisters();
        stackReset();
        reset();
        clear();
        storeROM(new Uint8Array([0x00, 0xe0, 0xa2, 0x2a]));
        setPC(ROM_START);
    });

    describe("00E0", () => {
        it("resets the display state", () => {
            setPixel(5, 5, 1);
            const opcode = fetch();
            expect(getPixel(5, 5)).toBe(1);
            emulator.decodeAndExecute(opcode);
            expect(getPixel(5, 5)).toBe(0);
        });
    });

    describe("1NNN", () => {
        it("sets the Program Counter", () => {
            expect(getPC()).toBe(ROM_START);
            emulator.decodeAndExecute(0x1345);
            expect(getPC()).toBe(0x345);
            emulator.decodeAndExecute(0x1ada);
            expect(getPC()).toBe(0xada);
        });
    });

    describe("2NNN", () => {
        it("sets the Program Counter to NNN", () => {
            expect(getPC()).toBe(ROM_START);
            emulator.decodeAndExecute(0x22D4);
            expect(getPC()).toBe(0x2D4);
        });
        it("pushes the previous Program Counter location to the top of the stack", () => {
            expect(getPC()).toBe(ROM_START);
            expect(stackLength()).toBe(0);
            emulator.decodeAndExecute(0x22D4);
            expect(stackLength()).toBe(1);
            expect(stackPeek()).toBe(ROM_START);
        });
    });

    describe("00EE", () => {
        it("sets the Program Counter to address in the top of the stack", () => {
            expect(getPC()).toBe(ROM_START);
            emulator.decodeAndExecute(0x22D4);
            expect(getPC()).toBe(0x2D4);
            expect(stackLength()).toBe(1);
            emulator.decodeAndExecute(0x00EE);
            expect(getPC()).toBe(ROM_START);
            expect(stackLength()).toBe(0);
        });
    });

    describe("3XNN", () => {
        it("skips one instruction if the value in VX is equal to NN", () => {
            const PC = getPC();
            setRegister(2, 0x01);
            emulator.decodeAndExecute(0x3201);
            // PC increments by 2 in this test because we're only testing the execute phase
            // where the skip occurs. In a normal Fetch-Decode-Execute cycle, PC would
            // be +4 total (+2 from fetch, +2 from skip)
            expect(getPC()).toBe(PC + 2);
        });

        it("does not skip an instruction if the value in VX is not equal to NN", () => {
            const PC = getPC();
            setRegister(2, 0xaf);
            emulator.decodeAndExecute(0x3201);
            // PC doesn't change in this test because we're only testing the execute phase.
            // In a normal Fetch-Decode-Execute cycle, PC would have already been
            // incremented by 2 during fetch.
            expect(getPC()).toBe(PC);
        });
    });

    describe("6XNN", () => {
        it("sets register X to NN", () => {
            expect(getRegister(0x3)).toBe(0);
            expect(getRegister(0xC)).toBe(0);
            emulator.decodeAndExecute(0x63FA);
            expect(getRegister(0x3)).toBe(0xFA);
            emulator.decodeAndExecute(0x6CAA);
            expect(getRegister(0xC)).toBe(0xAA);
        });
    });

    describe("7XNN", () => {
        it("adds NN to register X", () => {
            expect(getRegister(0x3)).toBe(0);
            emulator.decodeAndExecute(0x7322);
            expect(getRegister(0x3)).toBe(0x22);
            emulator.decodeAndExecute(0x7322);
            expect(getRegister(0x3)).toBe(0x44);
            emulator.decodeAndExecute(0x7301);
            expect(getRegister(0x3)).toBe(0x45);
        });
    });

    describe("8XY3", () => {
        it("sets VX to the XOR of VX and VY. Does not affect VY", () => {
            const testCases = [
                { input: [1, 1], expected: [0, 1] },
                { input: [0, 0], expected: [0, 0] },
                { input: [1, 0], expected: [1, 0] },
                { input: [0, 1], expected: [1, 1] },
                {
                    input: [0b11111111, 0b00001111],
                    expected: [0b11110000, 0b00001111],
                },
                {
                    input: [0b00100001, 0b10001100],
                    expected: [0b10101101, 0b10001100],
                },
            ];
            testCases.forEach(({ input, expected }) => {
                setRegister(0, input[0]);
                setRegister(1, input[1]);
                emulator.decodeAndExecute(0x8013);
                expect(getRegister(0)).toBe(expected[0]);
                expect(getRegister(1)).toBe(expected[1]);
            });
        });
    });

    describe("ANNN", () => {
        it("sets register I to NNN", () => {
            expect(getRegisterI()).toBe(0);
            emulator.decodeAndExecute(0xA010);
            expect(getRegisterI()).toBe(0x010);
            emulator.decodeAndExecute(0xAFFF);
            expect(getRegisterI()).toBe(0xFFF);
        });
    });

    describe("CXNN", () => {
        it("generates a random number and puts the result in VX", () => {
            const randos: Uint8[] = [];

            emulator.decodeAndExecute(0xC2FF);
            randos.push(getRegister(2));

            emulator.decodeAndExecute(0xC2FF);
            randos.push(getRegister(2));

            expect(typeof randos[0]).toBe("number");
            expect(typeof randos[1]).toBe("number");
            // @TODO: Fix non-deterministic test. Two random numbers between 0-255 have a 1/256 chance of being equal
            expect(randos[0]).not.toEqual(randos[1]);
        });

        it("correctly binary ANDs it with the value NN", () => {
            const randos: Uint8[] = [];

            for (let i = 0; i < 10; i++) {
                emulator.decodeAndExecute(0xC1F0);
                randos.push(getRegister(1));
            }

            // NN is 0xF0 which is binary 11110000, so all numbers should:
            // 1. Be divisible by 16 (last 4 bits must be 0)
            // 2. Be between 0 and 240 (0xF0)
            randos.forEach((num) => {
                expect(num % 16).toBe(0);
                expect(num).toBeLessThanOrEqual(240);
                expect(num).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe("DXYN", () => {
        const x = 3;
        const y = 2;

        beforeEach(() => {
            storeFont(font);
            clear();
            setRegisterI(FONT_START);
            setRegister(0x3, x);
            setRegister(0xA, y);
        });

        it("draws a sprite stored in I register to x and y", () => {
            // Run the instruction
            emulator.decodeAndExecute(0xD3A5);

            // Define the "0" glyph pattern for testing
            const expectedResult = [
                [1, 1, 1, 1, 0], // Row 1 of the 0 glyph
                [1, 0, 0, 1, 0], // Row 2 of the 0 glyph
                [1, 0, 0, 1, 0], // Row 3 of the 0 glyph
                [1, 0, 0, 1, 0], // Row 4 of the 0 glyph
                [1, 1, 1, 1, 0], // Row 5 of the 0 glyph
                [0, 0, 0, 0, 0], // Row 6 should not be part of the glyph
            ];

            // Check each row of the sprite pattern
            expectedResult.forEach((row, rowIndex) => {
                row.forEach((state, colIndex) => {
                    expect(getPixel(x + colIndex, y + rowIndex)).toBe(state);
                });
            });
        });

        it("limits the height of the sprite to draw to N rows", () => {
            // Run the instruction
            emulator.decodeAndExecute(0xD3A2);

            // Define the "0" glyph pattern for testing
            const expectedResult = [
                [1, 1, 1, 1, 0], // Row 1 of the 0 glyph
                [1, 0, 0, 1, 0], // Row 2 of the 0 glyph
                [0, 0, 0, 0, 0], // Row 3 of the 0 glyph should not be drawn
                [0, 0, 0, 0, 0], // Row 4 of the 0 glyph should not be drawn
            ];

            // Check each row of the sprite pattern
            expectedResult.forEach((row, rowIndex) => {
                row.forEach((state, colIndex) => {
                    expect(getPixel(x + colIndex, y + rowIndex)).toBe(state);
                });
            });
        });

        it("will flip pixels that are already on to off if they are in the sprite", () => {
            // draw a 0 glyph
            emulator.decodeAndExecute(0xD3A5);

            // draw the top 3 lines of the 7 glyph
            setRegisterI(FONT_START + 7 * 5);
            emulator.decodeAndExecute(0xD3A3);

            // Expected result after drawing the top 3 lines of the 7 glyph on a 0 glyph
            const expectedResult = [
                [0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 1, 1, 0],
                [1, 0, 0, 1, 0],
                [1, 1, 1, 1, 0],
            ];

            // Check each row of the sprite pattern
            expectedResult.forEach((row, rowIndex) => {
                row.forEach((state, colIndex) => {
                    expect(getPixel(x + colIndex, y + rowIndex)).toBe(state);
                });
            });
        });

        it("sets VF register to 1 if any pixels are turned off by this", () => {
            expect(getRegister(0xF)).toBe(0);
            emulator.decodeAndExecute(0xD3A5);
            expect(getRegister(0xF)).toBe(0);
            emulator.decodeAndExecute(0xD3A5);
            expect(getRegister(0xF)).toBe(1);
        });

        it.skip("wraps around the y and x values if they are larger than the screen", () => {});
    });

    describe("FX33", () => {
        it("takes the number in VX and stores each of each decimal digits in the address from register I to I+2", () => {
            const testCases = [
                { input: 146, expected: [1, 4, 6] },
                { input: 255, expected: [2, 5, 5] }, // Max value
                { input: 0, expected: [0, 0, 0] }, // Min value
                { input: 7, expected: [0, 0, 7] }, // Single digit
                { input: 99, expected: [0, 9, 9] }, // Two digits
            ];

            const addressToWriteTo = 0x777;

            testCases.forEach(({ input, expected }) => {
                setRegister(0x0, input);
                setRegisterI(addressToWriteTo);
                emulator.decodeAndExecute(0xF033);

                expect(read(addressToWriteTo)).toBe(expected[0]);
                expect(read(addressToWriteTo + 1)).toBe(expected[1]);
                expect(read(addressToWriteTo + 2)).toBe(expected[2]);
            });
        });
    });

    describe("FX55", () => {
        it("stores the values from registers 0 to X in memory addresses I to I+X", () => {
            const addr = ROM_START + 100;
            setRegister(0, 0xF0);
            setRegister(1, 0xF1);
            setRegister(2, 0xF2);
            setRegister(3, 0xF3);
            setRegisterI(addr);
            emulator.decodeAndExecute(0xF255);
            expect(read(addr + 0)).toBe(0xF0);
            expect(read(addr + 1)).toBe(0xF1);
            expect(read(addr + 2)).toBe(0xF2);
            expect(read(addr + 3)).toBe(0); // unchanged
        });
    });
});

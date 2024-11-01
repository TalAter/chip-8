import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { fetch, getPC, setPC, storeROM } from "../memory/memory.ts";
import { ROM_START } from "../memory/memory.ts";
import * as emulator from "../emulator/emulator.ts";
import {
    createTerminalDisplay,
    getPixel,
    setPixel,
} from "../display/display.ts";

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
        emulator.connectDisplay(createTerminalDisplay());
        const cartridgeData = new Uint8Array([0x00, 0xe0, 0xa2, 0x2a]);
        storeROM(cartridgeData);
        setPC(ROM_START);
    });

    describe("00E0", () => {
        it("resets the display state", () => {
            setPixel(5, 5, true);
            const opcode = fetch();
            expect(getPixel(5, 5)).toBe(true);
            emulator.decodeAndExecute(opcode);
            expect(getPixel(5, 5)).toBe(false);
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
});

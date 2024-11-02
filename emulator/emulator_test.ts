import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import {
    fetch,
    getPC,
    getRegister,
    getRegisterI,
    resetRegisters,
    setPC,
    storeROM,
} from "../memory/memory.ts";
import { ROM_START } from "../memory/memory.ts";
import * as emulator from "../emulator/emulator.ts";
import { getPixel, setPixel } from "../display/display.ts";

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
        const cartridgeData = new Uint8Array([0x00, 0xe0, 0xa2, 0x2a]);
        storeROM(cartridgeData);
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

    describe("ANNN", () => {
        it("sets register I to NNN", () => {
            expect(getRegisterI()).toBe(0);
            emulator.decodeAndExecute(0xA010);
            expect(getRegisterI()).toBe(0x010);
            emulator.decodeAndExecute(0xAFFF);
            expect(getRegisterI()).toBe(0xFFF);
        });
    });
});

/** Single binary digit (0 or 1) */
export type Bit = 0 | 1;

/** 4-bit unsigned integer (0x0-0xF) */
export type Uint4 = number;

/** 8-bit unsigned integer (0x00-0xFF) */
export type Uint8 = number;

/** 16-bit unsigned integer (0x0000-0xFFFF) */
export type Uint16 = number;

/** 12-bit memory address in CHIP-8's address space (0x000-0xFFF) */
export type MemoryAddress = Uint16;

/** Array of 8-bit numbers representing font sprite data */
export type FontData = Uint8[];

type ChipImplementation = "COSMAC VIP" | "SUPER-CHIP" | "CHIP48";

export type EmulatorConfig = {
    implementation: ChipImplementation;
    cyclesPerSecond: number;
    frameRate: number;
};

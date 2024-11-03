import type { FontData, MemoryAddress, Uint16 } from "../types.ts";

const memoryBuffer: ArrayBuffer = new ArrayBuffer(4096);
const memory: Uint8Array = new Uint8Array(memoryBuffer);
const ROM_START: MemoryAddress = 0x200;
const FONT_START: MemoryAddress = 0x050;

// The Program Counter. Points at the current instruction in memory
let PC: Uint16 = ROM_START;

// The Vx registers
// 16 general purpose 8-bit registers
const registers = new Uint8Array(16);

// The I register
// A single 16-bit register
const registerI = new Uint16Array(1);

/**
 * Stores font data starting at the font memory location (0x050)
 * @param data - Font sprite data for characters
 */
const storeFont = (data: FontData): void => {
  if (data.some((n) => n < 0 || n > 0xFF)) {
    throw new Error("Font data must consist of 8-bit numbers (0x00-0xFF)");
  }
  memory.set(data, FONT_START);
};

const storeROM = (data: Uint8Array): void => {
  memory.set(data, ROM_START);
};

const read = (address: MemoryAddress): number => {
  return memory[address];
};

const reset = (): void => {
  memory.fill(0);
};

const fetch = (): number => {
  const opcodes = (memory[PC] << 8) | memory[PC + 1];
  PC += 2 & 0xFFFF; // bitwise & to ensure PC stays 16-bit after increment
  return opcodes;
};

const setPC = (addr: MemoryAddress): void => {
  PC = addr & 0xFFFF;
};

const getPC = (): MemoryAddress => PC;

const getRegister = (x: number): number => {
  return registers[x];
};

const resetRegisters = (): void => {
  registers.fill(0);
};

const setRegister = (x: number, value: number): void => {
  registers[x] = value;
};

const getRegisterI = (): number => {
  return registerI[0];
};

const setRegisterI = (value: number): void => {
  registerI[0] = value;
};

export { FONT_START, ROM_START };
export {
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
  storeFont,
  storeROM,
};

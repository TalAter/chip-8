import { StackOverflowError, StackUnderflowError } from "../errors/errors.ts";
import type {
  FontData,
  MemoryAddress,
  Uint16,
  Uint4,
  Uint8,
} from "../types.ts";

const memoryBuffer: ArrayBuffer = new ArrayBuffer(4096);
const memory: Uint8Array = new Uint8Array(memoryBuffer);
const ROM_START: MemoryAddress = 0x200;
const FONT_START: MemoryAddress = 0x050;
/** Maximum size of the CHIP-8 stack */
const STACK_SIZE = 16;

/** Internal stack for storing return addresses */
const stack: Uint16[] = [];

// The Program Counter. Points at the current instruction in memory
let PC: Uint16 = ROM_START;

// The Vx registers
// 16 general purpose 8-bit registers
const registers = new Uint8Array(16);

// The I register
// A single 16-bit register
let registerI: Uint16 = 0;

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

const read = (address: MemoryAddress): Uint8 => {
  return memory[address];
};

const write = (address: MemoryAddress, value: Uint8Array): void => {
  if (address + value.length > memoryBuffer.byteLength) {
    throw new Error("Attempting to write outside memory bounds");
  }
  memory.set(value, address);
};

const reset = (): void => {
  memory.fill(0);
};

const fetch = (): Uint16 => {
  const opcodes = (memory[PC] << 8) | memory[PC + 1];
  setPC(PC + 2);
  return opcodes;
};

const setPC = (addr: MemoryAddress): void => {
  PC = addr & 0xFFFF; // Bitwise AND to ensure PC stays 16-bit after increment
};

const getPC = (): MemoryAddress => PC;

const getRegister = (x: Uint4): Uint8 => {
  return registers[x];
};

const resetRegisters = (): void => {
  registers.fill(0);
};

const setRegister = (x: Uint4, value: Uint8): void => {
  registers[x] = value;
};

const getRegisterI = (): Uint16 => {
  return registerI;
};

const setRegisterI = (value: Uint16): void => {
  registerI = value & 0xFFFF;
};

/**
 * Pushes an address onto the stack
 * @param addr - 16-bit address to store
 * @throws {StackOverflowError} If stack would exceed maximum size of 16
 */
const stackPush = (addr: Uint16): void => {
  if (stack.length >= STACK_SIZE) {
    throw new StackOverflowError();
  }
  stack.push(addr);
};

/**
 * Removes and returns the top address from the stack
 * @returns The last address pushed to the stack
 * @throws {StackUnderflowError} If stack is empty
 */
const stackPop = (): Uint16 => {
  if (stack.length === 0) {
    throw new StackUnderflowError();
  }
  return stack.pop()!;
};

/**
 * Resets the stack to empty state
 *
 * Used for testing only
 */
const stackReset = (): void => {
  stack.length = 0;
};

/**
 * Returns current number of items in the stack
 *
 * Used for testing only
 * @returns Number of items currently in stack (0-16)
 */
const stackLength = (): Uint4 => {
  return stack.length as Uint4;
};

/**
 * Returns the top value of the stack without removing it
 *
 * Used for testing only
 * @returns The last address pushed to the stack, or undefined if stack is empty
 */
const stackPeek = (): Uint16 | undefined => {
  return stack.at(-1);
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
  stackLength,
  stackPeek,
  stackPop,
  stackPush,
  stackReset,
  storeFont,
  storeROM,
  write,
};

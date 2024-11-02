const memoryBuffer: ArrayBuffer = new ArrayBuffer(4096);
const memory: Uint8Array = new Uint8Array(memoryBuffer);
const ROM_START = 0x200;
const FONT_START = 0x050;

// The Program Counter. Points at the current instruction in memory
const PC = new Uint16Array(1);
PC[0] = ROM_START;

// The Vx registers
// 16 general purpose 8-bit registers
const registers = new Uint8Array(16);

// The I register
// A single 16-bit register
const registerI = new Uint16Array(1);

const storeFont = (data: number[]): void => {
  memory.set(data, FONT_START);
};

const storeROM = (data: Uint8Array): void => {
  memory.set(data, ROM_START);
};

const read = (address: number): number => {
  return memory[address];
};

const fetch = (): number => {
  const opcodes = (memory[PC[0]] << 8) | memory[PC[0] + 1];
  PC[0] += 2 & 0xFFFF; // bitwise & to ensure PC stays 16-bit after increment
  return opcodes;
};

const setPC = (addr: number): void => {
  PC[0] = addr & 0xFFFF;
};

const getPC = (): number => PC[0];

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
  resetRegisters,
  setPC,
  setRegister,
  setRegisterI,
  storeFont,
  storeROM,
};

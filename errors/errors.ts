import type { Uint16 } from "../types.ts";

export class UnknownOpcodeError extends Error {
    public readonly opcode: Uint16;

    constructor(opcode: Uint16) {
        super(
            `Unknown OPCode 0x${
                opcode.toString(16).padStart(4, "0").toUpperCase()
            }`,
        );
        this.name = "UnknownOpcodeError";
        this.opcode = opcode;

        // Maintains proper stack trace in V8 engines (Node.js, Chrome)
        Object.setPrototypeOf(this, UnknownOpcodeError.prototype);
    }
}

export class StackOverflowError extends Error {
    constructor() {
        super("Stack overflow");
        this.name = "StackOverflowError";
    }
}

export class StackUnderflowError extends Error {
    constructor() {
        super("Stack underflow");
        this.name = "StackUnderflowError";
    }
}

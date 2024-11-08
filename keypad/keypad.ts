const handleKeyPresses = async (): Promise<void> => {
    // Enable raw mode for stdin to capture keypresses immediately
    Deno.stdin.setRaw(true, { cbreak: true });

    const buffer = new Uint8Array(1);

    while (true) {
        const bytesRead = await Deno.stdin.read(buffer);
        if (bytesRead === null) break; // EOF
        if (bytesRead === 1) {
            switch (buffer[0]) {
                case 27:
                    Deno.exit();
            }
        }
    }
};

export { handleKeyPresses };

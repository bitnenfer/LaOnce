const Input = {
    preventDefaultKeys: [32, 38, 40],
    anyDown: () => {
        // const keys = Object.keys(Input.Keyboard.keysDown);
        // for (let i = 0; i < keys.length; ++i) {
        //     if (Input.Keyboard.keysDown[keys[i]]) return true;
        // }
        for (const key in Input.Keyboard.keysDown) {
            if (Input.Keyboard.keysDown[key]) return true;
        }
        return false;
    },
    gamepads: [],
    init: (canvas) => {
        let audioStarted = false;
        const enableAudio = () => {
            if (!audioStarted) {
                zzfxV=0;
                zzfx(...[]);
                zzfxV = 0.2;
                audioStarted = true;
            }
        }
        window.addEventListener("gamepadconnected", (e) => {});
        window.onkeydown = (e) => {
            const kc = e.keyCode;
            if (!Input.Keyboard.keysDown[kc]) {
                Input.Keyboard.keysClicked[kc] = true;
            }
            Input.Keyboard.keysDown[kc] = true;
            if (Input.preventDefaultKeys.indexOf(kc) >= 0) {
                e.preventDefault();
            }
            Input.Keyboard.keysUp[kc] = false;
            enableAudio();
        };
        window.onkeyup = (e) => {
            const kc = e.keyCode;
            Input.Keyboard.keysClicked[kc] = false;
            Input.Keyboard.keysDown[kc] = false;
            Input.Keyboard.keysUp[kc] = true;
            if (Input.preventDefaultKeys.indexOf(kc) >= 0) {
                e.preventDefault();
            }
            enableAudio();
        };
    },
    gamepadUpdate: () => {
        if (!navigator['getGamepads']) return;
        const p = navigator.getGamepads();
        for (let i = 0; i < p.length; ++i) {
            if (p[i]) {
                Input.gamepads[p[i].index] = p[i];
            }
        }
    },
    getGamepad: () => {
        for (let i = 0; i < Input.gamepads.length; ++i) {
            if (Input.gamepads[i]) return Input.gamepads[i];
        }
        return null;
    },
    Keyboard: { keysDown: {}, keysUp: {}, keysClicked: {}, down: (key) => Input.Keyboard.keysDown[key], click: (key) => {
        if (Input.Keyboard.keysClicked[key]) {
            Input.Keyboard.keysClicked[key] = false;
            return true;
        }
        return false;
    }, up: (key) => {
        if (Input.Keyboard.keysUp[key]) {
            Input.Keyboard.keysUp[key] = false;
            return true;
        }
        return false;
    }}
};


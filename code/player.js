#define MAX_SPEED 50
#define WALK_SPEED 20

const Player = {

    sphereMesh: null,
    gameObject: null,
    physicsObject: null,
    isWalking: false,
    isRunning: false,
    hairMesh: null,
    soundDelay: 1,
    textDelay: 1,
    walkToHouse: false,
    walkToHouse2: false,
    blockInput: false,

    init: (x, y, z, hairMesh) => {
        const radius = 2.0;
        Player.sphereMesh = MeshBuilder.createSphere(radius, 30, 30);
        Player.gameObject = Engine.createGameObject(x, y, z, Player.sphereMesh);
        Player.physicsObject = Engine.createPhysicsObject(Player.gameObject, Engine.Physics.Collision.makeSphere([0, 0, 0], radius * 1.5));
        Engine.Physics.add(Player.physicsObject);
        Player.physicsObject.elasticity = 0;
        Player.physicsObject.velocity[2] = 0.4;
        Player.physicsObject.offset[1] = -1.0;
        Player.gameObject.rotation[1] = degToRad(-90+-45);
        Player.hairMesh = hairMesh;
    },

    renderText: (gameItems) => {
        if (gameItems.current && gameItems.current.needed < 99) {
            if (gameItems.current.count < gameItems.current.needed) {
                Dialogues.Rata.renderText(gameItems.current.count + '/' + gameItems.current.needed);
                Player.textDelay = 1;
            } else {
                if (Player.textDelay > 0) {
                    Dialogues.Rata.renderText('YAY!');
                    Player.textDelay -= 0.008;
                }
            }
        }
    },

    update: () => {
        const gamepad = Input.getGamepad();
        Player.isWalking = false;

        Player.isRunning = (!!Input.Keyboard.down(16) || (gamepad && gamepad.buttons[0].pressed));

        let walkScale = 1.0 * (Player.isRunning ? 2 : 1.0);

        if (!Player.blockInput && Dialogues.isDone() && !Player.walkToHouse) {
            if (Input.anyDown()) {
                if (Input.Keyboard.down(38)) {
                    Player.physicsObject.velocity[2] = -WALK_SPEED * walkScale;
                    Player.isWalking = true;

                } else if (Input.Keyboard.down(40)) {
                    Player.physicsObject.velocity[2] = +WALK_SPEED * walkScale;
                    Player.isWalking = true;
                }

                if (Input.Keyboard.down(37)) {
                    Player.physicsObject.velocity[0] = -WALK_SPEED * walkScale;
                    Player.isWalking = true;
                } else if (Input.Keyboard.down(39)) {
                    Player.physicsObject.velocity[0] = +WALK_SPEED * walkScale;
                    Player.isWalking = true;
                }
            } else if (gamepad) {
                const x = gamepad.axes[0];
                const y = gamepad.axes[1];
                const sum = abs(x) + abs(y);
                if (sum > 0.6) {
                    const angle = atan2(y, x) - degToRad(45);
                    Player.physicsObject.velocity[0] = cos(angle) * (WALK_SPEED * walkScale * 1.2);
                    Player.physicsObject.velocity[2] = sin(angle) * (WALK_SPEED * walkScale * 1.2);
                    Player.isWalking = true;
                }
            }

            if (abs(Vec3.dist([0, 0, 0], Player.physicsObject.position)) > 250) {
                const dir = Vec3.norm(Vec3.sub([0, 0, 0], Player.physicsObject.position));
                Player.physicsObject.position = Vec3.add(Player.physicsObject.position, Vec3.scale(dir, 0.01*Vec3.len(Player.physicsObject.velocity)));
                Player.physicsObject.velocity[0] *= dir[0] * 0.75;
                Player.physicsObject.velocity[2] *= dir[2] * 0.75;
            }

        }

        if (Player.walkToHouse) {
            Player.physicsObject.static = true;
            Player.physicsObject.useGravity = false;
            if (!Player.walkToHouse2) {
                const target1 = [0, 0, -16];
                const dir = Vec3.norm(Vec3.sub(target1, Player.gameObject.position));
                Player.physicsObject.velocity = Vec3.scale(dir, WALK_SPEED);
                Player.physicsObject.velocity[1] = 0;
                const dist = Vec3.dist(Player.gameObject.position, target1);
                if (dist <= 1.3) {
                    Player.walkToHouse2 = true;
                    Player.physicsObject.velocity[0] = 0;
                    Player.physicsObject.velocity[1] = 0;
                    Player.physicsObject.velocity[2] = 0;
                }
                Player.isWalking = true;
            } else {
                if (Player.physicsObject.position[1] < 4) {
                    Player.physicsObject.position[1] += 0.2;
                }
                if (Player.gameObject.position[2] > -32) {
                    Player.physicsObject.velocity[2] = -WALK_SPEED;
                    Player.isWalking = true;
                } else {
                    Player.physicsObject.velocity[2] = 0;
                    Player.isWalking = false;
                }
            }
        }

        if (Dialogues.isDone()) {
            const lookingAngle = atan2(Player.physicsObject.velocity[2], Player.physicsObject.velocity[0]);
            Player.gameObject.rotation[1] = lookingAngle - degToRad(90);
        }

        if (Player.isWalking && (Player.soundDelay -= (Player.isRunning ? 0.1 : 0.05)) < 0) {
            zzfxV=0.05;
            zzfx(...[,,16,.04,,.03,,.6,,,,,,1.2,.3,,,,.02,.01]);
            Player.soundDelay = 1;
            zzfxV=0.2;
        }
    },

    time: 0,
    indepTime: 0,
    render: () => {
        const isRunning = Player.isRunning && Player.isWalking;
        const moveScale = 1.0 * (isRunning ? 3.5 : 2);
        const parentModelMatrix = Mat4.trans(Player.gameObject.getModelMatrix(), [0, abs(0.2*sin(2.5*Player.time * isRunning)) * moveScale,0]);
        if (Player.isWalking)
            Player.time += 0.01 * (isRunning ? 3.0 : 2.0);
        else
            Player.time = 0;

        Player.indepTime += 0.01;


        const limbColor = [1.2, 0.4, 0.4];
        const eyeColor = [0.1, 0.1, 0.2];
        const torsoColor =  [1.3, 1.0, 1.0];

        const limbScale = 0.3;
        const limbScaleVector = [limbScale, limbScale * 0.8, limbScale * 1.8];
        const handScaleVector = [limbScale * 0.7, limbScale* 0.7, limbScale* 0.7];
        const eyeScale = 0.4;
        const eyeScaleVector = [eyeScale * .3, eyeScale * 0.8, eyeScale*0.25];

        // Head
        const headMatrix = Mat4.mul(Mat4.fromEuler([0, sin(Player.time * 5) * .2 + (isRunning ? 0 : 1) * (sin(Player.indepTime) * 0.2), 0]), Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, 4 + sin(Player.time * 4) * 0.5 + sin(Player.indepTime) * 0.25, isRunning ? 0.8 : 0.0]), [1.25, 1.25, 1.25]));
        const headParentMatrix = Mat4.mul(headMatrix, parentModelMatrix);

        Renderer.drawMesh(Player.sphereMesh,  headParentMatrix, torsoColor);
        Renderer.drawMesh(Player.hairMesh,  Mat4.mul(Mat4.rotX(Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, 1.9, -0.2]), [1, 0.8, 1]), -0.9), headParentMatrix), torsoColor);

        Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, -0.0, 2.0]), [0.1, 0.1, 0.1]), headParentMatrix), limbColor);
        // Left Ear
        Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([0, 0.2, 0.0]),
                        Mat4.trans(Mat4.makeIdent(), [2.1, 2.0, -.15])
                ), [0.7, 0.7, 0.2])
        , headMatrix), parentModelMatrix), limbColor);

        // Right Ear
        Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([0, -0.2, 0.0]),
                        Mat4.trans(Mat4.makeIdent(), [-2.1, 2.0, -.15])
                ), [0.7, 0.7, 0.2])
        , headMatrix), parentModelMatrix), limbColor);

        // Left Eye
        Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([0.2, -.5, 0]),
                        Mat4.trans(Mat4.makeIdent(), [0.99, 0.5, 1.6])
                ), eyeScaleVector)
        , headMatrix), parentModelMatrix), eyeColor);

        // Right Eye
        Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([.2, .5, 0]),
                        Mat4.trans(Mat4.makeIdent(), [-0.99, 0.5, 1.6])
                ), eyeScaleVector)
        , headMatrix), parentModelMatrix), eyeColor);

        // Torso
        const torsoMatrix = Mat4.mul(Mat4.fromEuler([0, sin(Player.time * 5) * .2, 0]), Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, 0.2 + sin(Player.time * 4) * 0.5 + sin(Player.indepTime + 1.5) * 0.25, 0]), [0.6, 0.6, 0.6]));
        Renderer.drawMesh(Player.sphereMesh, Mat4.mul(torsoMatrix, parentModelMatrix), torsoColor);

        // Tail
        Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.trans(
                        Mat4.fromEuler([(isRunning ? -0.4 : 0) + -0.1 + sin(Player.indepTime) * 0.1, sin(moveScale*Player.indepTime + 2) * 0.25, 0]), [0.0, -0.7, -3.5]), [0.4, 0.4, 0.7]
                )
        , torsoMatrix), parentModelMatrix), limbColor);

        if (Player.isWalking) {
            // Left Foot
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [1, -1.2 + -(sin(Player.time * 5.))*(0.2*moveScale), 0.4+(cos(Player.time * 5.)) * (0.5*moveScale)]), limbScaleVector),
                    Mat4.fromEuler([sin(-(Player.time * 5.))*0.5, 0, 0])
                )
            , parentModelMatrix), limbColor);
            // Right Foot
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [-1, -1.2 + -(sin(2.5+Player.time * 5.))*(0.2*moveScale), 0.4+(cos(2.5+Player.time * 5.)*(0.5*moveScale))]), limbScaleVector),
                    Mat4.fromEuler([sin(-(2.5+Player.time * 5.))*0.5, 0, 0])
                )
            , parentModelMatrix), limbColor);

            // Left Hand
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [2.5, 0.5, 0]), handScaleVector),
                    Mat4.fromEuler([0, cos(2.5+Player.time * 5.)*.5*moveScale*.5, 0])
                )
            , parentModelMatrix), limbColor);
            // Right Hand
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [-2.5, 0.5, 0]), handScaleVector),
                    Mat4.fromEuler([0, sin(2.5+Player.time * 5.)*.5*moveScale*.5, 0])
                )
            , parentModelMatrix), limbColor);
        } else {
            // Left Foot
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [1, -1.5, 0]), limbScaleVector)
            , parentModelMatrix), limbColor);
            // Right Foot
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [-1, -1.5, 0]), limbScaleVector)
            , parentModelMatrix), limbColor);

            // Left Hand
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [2.5, 0.5, 0]), handScaleVector)
            , parentModelMatrix), limbColor);
            // Right Hand
            Renderer.drawMesh(Player.sphereMesh,  Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [-2.5, 0.5, 0]), handScaleVector)
            , parentModelMatrix), limbColor);
        }
    }
};
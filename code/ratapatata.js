const RataPatata = {

    sphereMesh: null,
    gameObject: null,
    physicsObject: null,
    hairMesh: null,
    caneMesh: null,
    walkToHouse: false,
    walkToYard: false,
    startChimenea: false,
    isWalking: false,

    init: (x, y, z, hairMesh) => {
        const radius = 2.0;
        RataPatata.sphereMesh = MeshBuilder.createSphere(radius, 30, 30);
        RataPatata.caneMesh = MeshBuilder.createCube(0.1, 1, 0.1);
        RataPatata.sphereMesh.setFaceCulling(0);
        RataPatata.gameObject = Engine.createGameObject(x, y, z, RataPatata.sphereMesh);
        RataPatata.physicsObject = Engine.createPhysicsObject(RataPatata.gameObject, Engine.Physics.Collision.makeSphere([0, 0, 0], radius * 1.5));
        Engine.Physics.add(RataPatata.physicsObject);
        
        RataPatata.physicsObject.static = true;
        RataPatata.physicsObject.useGravity = false;
        RataPatata.physicsObject.elasticity = 0;
        RataPatata.physicsObject.velocity[2] = 0.4;
        RataPatata.physicsObject.offset[1] = -1.0;
        RataPatata.hairMesh = hairMesh;
    },

    update: () => {
        let isMoving = false;
        if (Dialogues.isDone()) {
            if (RataPatata.walkToHouse) {
                isMoving = true;
                if (RataPatata.physicsObject.position[2] < -19) {
                    if (RataPatata.physicsObject.position[1] < 4) {
                        RataPatata.physicsObject.position[1] += 0.2;
                    }
                }
                if (RataPatata.physicsObject.position[2] > -35) {
                    RataPatata.physicsObject.velocity[2] = -5;
                    RataPatata.isWalking = true;
                } else {
                    RataPatata.isWalking = false;
                    RataPatata.physicsObject.velocity[2] = 0;
                    RataPatata.walkToHouse = false;
                    if (!RataPatata.startChimenea) {
                        setTimeout(() => {
                                RataPatata.walkToYard = true;
                                RataPatata.startChimenea = true;
                        }, 1000);
                    } else {
                        Player.walkToHouse = true;
                    }
                }
            } else if (RataPatata.walkToYard) {
                isMoving = true;
                if (RataPatata.physicsObject.position[2] > -19) {
                    if (RataPatata.physicsObject.position[1] > 0) {
                        RataPatata.physicsObject.position[1] -= 0.2;
                    }
                }
                if (RataPatata.physicsObject.position[2] < -12) {
                    RataPatata.physicsObject.velocity[2] = +5;
                    RataPatata.isWalking = true;
                } else {
                    RataPatata.isWalking = false;
                    RataPatata.walkToYard = false;
                    RataPatata.physicsObject.velocity[2] = 0;
                    isMoving = false;
                    RataPatata.gameObject.rotation[1] = 0;
                }
            }
        }


        if (isMoving) {
            const lookingAngle = atan2(RataPatata.physicsObject.velocity[2], RataPatata.physicsObject.velocity[0]);
            RataPatata.gameObject.rotation[1] = lookingAngle - degToRad(90);
        }
    },

    time: 0,
    indepTime: 0,
    render: () => {
        const isRunning = false;
        const moveScale = 1.2;
        const parentModelMatrix = Mat4.trans(RataPatata.gameObject.getModelMatrix(), [0, abs(0.2*sin(2.5*RataPatata.time * isRunning)) * moveScale,0]);
        if (RataPatata.isWalking)
            RataPatata.time += 0.01;
        else
            RataPatata.time = 0;

        RataPatata.indepTime += 0.01;

        const limbColor = Vec3.scale([1.2, 0.4, 0.4], 0.8);
        const eyeColor = [0.1, 0.1, 0.2];
        const torsoColor =  [1.2, 1.0, 1.0];

        const limbScale = 0.3;
        const limbScaleVector = [limbScale, limbScale * 0.8, limbScale * 1.8];
        const handScaleVector = [limbScale * 0.7, limbScale* 0.7, limbScale* 0.7];
        const eyeScale = 0.4;
        const eyeScaleVector = [eyeScale * .8, eyeScale * 0.15, eyeScale*0.25];

        // Head
        const headMatrix = Mat4.mul(Mat4.fromEuler([0, sin(RataPatata.time * 5) * .2 + (isRunning ? 0 : 1) * (sin(RataPatata.indepTime) * 0.2), 0]), Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, 3.5 + sin(RataPatata.time * 4) * 0.5 + sin(RataPatata.indepTime) * 0.25, isRunning ? 0.8 : 0.8]), [1.25, 1.25, 1.25]));
        const headParentMatrix = Mat4.mul(headMatrix, parentModelMatrix);

        Renderer.drawMesh(RataPatata.sphereMesh,  headParentMatrix, torsoColor);
        Renderer.drawMesh(RataPatata.hairMesh,  Mat4.mul(Mat4.rotX(Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, 0.5, 0]), [0.25, 0.25, 0.25]), 0), headParentMatrix), Vec3.scale(torsoColor, 1.4));

        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, 0.5, 2.0]), [0.1, 0.1, 0.1]), headParentMatrix), limbColor);
        // Left Ear
        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([-0.5, 0.7, 0.0]),
                        Mat4.trans(Mat4.makeIdent(), [2.1, 0.2, -.15])
                ), [0.7, 0.7, 0.2])
        , headMatrix), parentModelMatrix), limbColor);

        // Right Ear
        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([-0.5, -0.7, 0.0]),
                        Mat4.trans(Mat4.makeIdent(), [-2.1, 0.9, -.15])
                ), [0.7, 0.7, 0.2])
        , headMatrix), parentModelMatrix), limbColor);

        // Left Eye
        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([0.9, -.5, 0]),
                        Mat4.trans(Mat4.makeIdent(), [0.99, 0.5, 1.6])
                ), eyeScaleVector)
        , headMatrix), parentModelMatrix), eyeColor);

        // Right Eye
        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.mul(
                        Mat4.fromEuler([.9, .5, 0]),
                        Mat4.trans(Mat4.makeIdent(), [-0.99, 0.5, 1.6])
                ), eyeScaleVector)
        , headMatrix), parentModelMatrix), eyeColor);

        // Torso
        const torsoMatrix = Mat4.mul(Mat4.fromEuler([0, sin(RataPatata.time * 5) * .2, 0]), Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0, 0.2 + sin(RataPatata.time * 4) * 0.5 + sin(RataPatata.indepTime + 1.5) * 0.25, 0]), [0.6, 0.6, 0.6]));
        Renderer.drawMesh(RataPatata.sphereMesh, Mat4.mul(torsoMatrix, parentModelMatrix), torsoColor);

        // Tail
        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(Mat4.mul(
                Mat4.scale(
                    Mat4.trans(
                        Mat4.fromEuler([(isRunning ? -0.4 : 0) + -0.1 + sin(RataPatata.indepTime) * 0.1, sin(moveScale*RataPatata.indepTime + 2) * 0.25, 0]), [0.0, -0.7, -3.5]), [0.4, 0.4, 0.7]
                )
        , torsoMatrix), parentModelMatrix), limbColor);

        if (RataPatata.isWalking) {
            // Left Foot
            Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(
                Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [1, -1.2 + -(sin(RataPatata.time * 5.))*(0.2*moveScale), 0.4+(cos(RataPatata.time * 5.)) * (0.5*moveScale)]), limbScaleVector),
                    Mat4.fromEuler([sin(-(RataPatata.time * 5.))*0.5, 0, 0])
                )
            , parentModelMatrix), limbColor);
            // Right Foot
            Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(
                Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [-1, -1.2 + -(sin(2.5+RataPatata.time * 5.))*(0.2*moveScale), 0.4+(cos(2.5+RataPatata.time * 5.)*(0.5*moveScale))]), limbScaleVector),
                    Mat4.fromEuler([sin(-(2.5+RataPatata.time * 5.))*0.5, 0, 0])
                )
            , parentModelMatrix), limbColor);
        } else {
            // Left Foot
            Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0.5, -1.5, 0]), limbScaleVector)
            , parentModelMatrix), limbColor);
            // Right Foot
            Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), [-0.5, -1.5, 0]), limbScaleVector)
            , parentModelMatrix), limbColor);
        }

         // Left Hand
        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(
                Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0.3, 0.7, 1.9]), handScaleVector)
        , parentModelMatrix), limbColor);
        // Right Hand
        Renderer.drawMesh(RataPatata.sphereMesh,  Mat4.mul(
                Mat4.scale(Mat4.trans(Mat4.makeIdent(), [-0.3, 0.7, 1.9]), handScaleVector)
        , parentModelMatrix), limbColor);

        Renderer.drawMesh(RataPatata.caneMesh,  Mat4.mul(
                Mat4.scale(Mat4.trans(Mat4.makeIdent(), [0.0, -0.5, 2.2]), [1, 1, 1])
        , parentModelMatrix), [0.2, 0.1, 0.1]);

    }

};
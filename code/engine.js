const Engine = {
    lastTime: 0,
    currentTime: 0,
    getDeltaTime: () => Engine.currentTime - Engine.lastTime,
    Physics: {
        Collision: {
            makeSphere: (position, radius) => { return { position, radius } }
        },
        forEach: (cb) => {
            Engine.Physics.sphereList.forEach(cb);
        },
        sphereList: [],
        gravity: { x: 0, y: -0.5,  z: 0 },
        clear: () => {
            Engine.Physics.sphereList.length = 0;
        },
        add: (physicsObject) => {
            if (physicsObject.collider) {
                Engine.Physics.sphereList.push(physicsObject);
                return;
            }
            #if DEBUG
            console.error('Physics Object must have a collider');
            #endif
        },
        remove: (physicsObject) => {
            Engine.Physics.sphereList.splice(Engine.Physics.sphereList.indexOf(physicsObject), 1);
        },
        addArray: (array) => {
            array.forEach((e) => Engine.Physics.add(e));
        },
        update: (terrainFunc) => {
            const deltaTime = Engine.getDeltaTime() / 1000.0;
            let i = 0;
            Engine.Physics.sphereList.forEach((physicsObject) => {
                if (physicsObject.usePhysics) {
                    if (physicsObject.useGravity) {
                        physicsObject.velocity[0] += Engine.Physics.gravity.x;
                        physicsObject.velocity[1] += Engine.Physics.gravity.y;
                        physicsObject.velocity[2] += Engine.Physics.gravity.z;
                    }
                    physicsObject.position[0] += physicsObject.velocity[0] * deltaTime;
                    physicsObject.position[1] += physicsObject.velocity[1] * deltaTime;
                    physicsObject.position[2] += physicsObject.velocity[2] * deltaTime;

                    const r = physicsObject.collider.radius * (physicsObject.gameObject ? physicsObject.gameObject.scale : 1.0); 
                    const x = physicsObject.position[0] + physicsObject.collider.position[0];
                    const y = physicsObject.position[1] + physicsObject.collider.position[1];
                    const z = physicsObject.position[2] + physicsObject.collider.position[2];

                    const terrainY = -0.8;
                    const E = 1;
                    const n = [0, 1, 0];

                    if (y - r < terrainY) {
                        physicsObject.position[0] = x;
                        physicsObject.position[1] = terrainY + r;
                        physicsObject.position[2] = z;
                        if (!physicsObject.hasCollided) {
                            physicsObject.hasCollided = true;
                            physicsObject.velocity = Vec3.scale(Vec3.reflect(physicsObject.velocity, n), physicsObject.elasticity);
                        } else {
                            physicsObject.velocity = Vec3.scale(physicsObject.velocity, physicsObject.friction);
                        }
                    } else {
                        physicsObject.hasCollided = false;
                    }
                }
            });

            for (let index = 0; index < 5; ++index)
                Engine.Physics.sphereList.forEach((tester) => {
                    const testerRadius = tester.collider.radius * (tester.gameObject ? tester.gameObject.scale : 1.0);
                    if (!tester.static) {
                        const testerPosition = Vec3.add(tester.position, tester.collider.position);
                        Engine.Physics.sphereList.forEach((testee) => {
                            if (tester !== testee) {
                                const testeePosition = Vec3.add(testee.position, testee.collider.position);
                                const testeeRadius = testee.collider.radius * (testee.gameObject ? testee.gameObject.scale : 1.0);
                                const dist = Vec3.dist(testeePosition, testerPosition);
                                const rad = (testerRadius + testeeRadius);
                                if (dist < rad) {
                                    if (!testee.overlapOnly) {
                                        const dir = Vec3.div(Vec3.sub(testerPosition, testeePosition), [dist, dist, dist]);
                                        const sep = rad - dist;
                                        const ori = Vec3.scale(Vec3.scale(dir, sep), 1);
                                        tester.position = Vec3.sub(Vec3.add(testerPosition, ori), tester.collider.position);
                                        tester.velocity = Vec3.scale(Vec3.reflect(tester.velocity, dir), tester.elasticity);
                                    }
                                    tester.onObjectCollision && tester.onObjectCollision(testee);
                                    testee.onObjectCollision && testee.onObjectCollision(tester);
                                }
                            }
                        });
                    }
                });
        },
        updateGameObjects: () => {
            Engine.Physics.sphereList.forEach((physicsObject) => {
                if (physicsObject.gameObject) {
                    physicsObject.gameObject.position[0] = physicsObject.position[0] + physicsObject.offset[0];
                    physicsObject.gameObject.position[1] = physicsObject.position[1] + physicsObject.offset[1];
                    physicsObject.gameObject.position[2] = physicsObject.position[2] + physicsObject.offset[2];
                }
            });
        }
    },
    createGameObject: (x, y, z, staticMesh) => {
        const gameObject = {
            staticMesh: staticMesh ? staticMesh : null,
            position: [x, y, z],
            rotation: [0, 0, 0],
            scale: 1,
            color: [1, 1, 1],
            cullRadius: 1.0,
            physicsObjects: [],
            getModelMatrix: () => {
                let modelMatrix = Mat4.mul(
                    Mat4.fromEuler(gameObject.rotation),
                    Mat4.scale(Mat4.trans(Mat4.makeIdent(), gameObject.position), [gameObject.scale, gameObject.scale, gameObject.scale])
                );
                return modelMatrix;
            }
        };
        return gameObject;
    },
    createPhysicsObject: (gameObjectOrPosition, collisionPrimitive) => {
        const physicsObject = {
            gameObject: gameObjectOrPosition.position ? gameObjectOrPosition : null,
            position: gameObjectOrPosition.position ? gameObjectOrPosition.position.slice() : gameObjectOrPosition,
            offset: [0, 0, 0],
            velocity: [0, 0, 0],
            collider: collisionPrimitive,
            hasCollided: false,
            static: false,
            elasticity: 0.5,
            friction: 0.9,
            onTerrainCollision: null,
            onObjectCollision: null,
            usePhysics: true,
            useGravity: true,
            overlapOnly: false
        };
        if (gameObjectOrPosition.position) {
            gameObjectOrPosition.physicsObjects.push(physicsObject);
        }
        return physicsObject;
    }
};
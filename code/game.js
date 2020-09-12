const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');

#if DEBUG
window.gl = gl;
#endif

canvas.style.display = 'block';
canvas.style.margin = 'auto';
document.body.style.backgroundColor = '#F2D5E3'

#include "../code/renderer.js"
#include "../code/camera.js"
#include "../code/engine.js"
#include "../code/input.js"
#include "../code/math.js"
#include "../code/mesh-builder.js"
#include "../code/player.js"
#include "../code/terrain.js"
#include "../code/shadow-map.js"
#include "../code/ratapatata.js"
#include "../code/text-buffer.js"
#include "../code/smoke-particle.js"
#include "../code/dialogues.js"
#include "../code/ZzFX.micro.js"

//Assets
#include "../code/meshes/grass.obj.js"
#include "../code/meshes/treeBottom.obj.js"
#include "../code/meshes/treeTop.obj.js"
#include "../code/meshes/houseTop.obj.js"
#include "../code/meshes/houseBottom.obj.js"

#if DEBUG
#include "../code/profiler-gl.js"
#include "../extern/fpsmeter.js"
#endif

window.onload = () => {
    let startPlayingGame = false;
    let isTheEnd = false;
    let sampleElement = null;
    const gameItems = {
        current: null,
        timber: {
            nextDialogueIndex: 1,
            staticMesh: MeshBuilder.createCube(2, 0.4, 0.4),
            color: [0.8, 0.2, 0.1],
            radiusMin: 130,
            radiusMax: 150,
            neededScale: 3,
            needed: 10,
            count: 0
        },
        apples: {
            nextDialogueIndex: 2,
            staticMesh: MeshBuilder.createSphere(1, 5, 5),
            color: [1.5, 0.1, 0.0],
            radiusMin: 180,
            radiusMax: 210,
            neededScale: 3,
            needed: 8,
            count: 0
        },
        mint: {
            nextDialogueIndex: 3,
            staticMesh: MeshBuilder.createQuad(1.5, 1.0).setFaceCulling(0),
            color: [0.2, 1.0, 0.1],
            radiusMin: 210,
            radiusMax: 260,
            neededScale: 2,
            needed: 4,
            count: 0
        },
        tmp: {
            nextDialogueIndex: 0,
            staticMesh: MeshBuilder.createQuad(0, 0).setFaceCulling(gl.FRONT_AND_BACK),
            color: [0.4, 1.4, 0.1],
            radiusMin: 910,
            radiusMax: 960,
            neededScale: 0,
            needed: 99,
            count: 0
        }
    };

    gameItems.current = gameItems.timber;
    const collectableItems = [];

    #if DEBUG
    ProfilerGL.init(gl);
    const fpsMeter = new FPSMeter({graph: true});
    #endif

    Input.init(canvas);
    Renderer.init(gl);
    ShadowMap.init(gl, Vec3.norm([-0.5, -1, -0.5]), 400, 4096);
    Terrain.init(1800);

    const scenePipeline = Renderer.createPipeline({
        vs: `%{shaders/scene.vs}`,
        fs: `%{shaders/scene.fs}`,
        vertexLayout: [
            { name: 'p', size: 3, type: 5126, stride: 0, offset: 0 }
        ],
        uniforms: [
            { name: 'm', size: 4, type: 'f', value: Mat4.makeIdent(), isMatrix: true },
            { name: 'n', size: 4, type: 'f', value: Mat4.makeIdent(), isMatrix: true },
            { name: 'b', size: 4, type: 'f', value: Mat4.makeIdent(), isMatrix: true },
            { name: 'c', size: 3, type: 'f', value: [0, 0, 0] },
            { name: 'g', size: 3, type: 'f', value: [1, 1, 1] },
            { name: 's', size: 1, type: 'i', value: 0 },
            { name: 'd', size: 1, type: 'i', value: 1 },
            { name: 'l', size: 3, type: 'f', value: [0, 0, 0] }
        ],
    });

    const vertexSize = Float32Array.BYTES_PER_ELEMENT * 5;
    const texturedPipeline = Renderer.createPipeline({
        vs: `%{shaders/textured.vs}`,
        fs: `%{shaders/textured.fs}`,
        vertexLayout: [
            { name: 'p', size: 3, type: 5126, stride: vertexSize, offset: 0 },
            { name: 'v', size: 2, type: 5126, stride: vertexSize, offset: 12 }
        ],
        uniforms: [
            { name: 'm', size: 4, type: 'f', value: Mat4.makeIdent(), isMatrix: true },
            { name: 'c', size: 3, type: 'f', value: [0, 0, 0] },
            { name: 's', size: 1, type: 'i', value: 0 }
        ]
    });

    const postProcessPipeline = Renderer.createPipeline({
        vs: `%{shaders/post.vs}`,
        fs: `%{shaders/post.fs}`,
        vertexLayout: [
            { name: 'p', size: 3, type: 5126, stride: 0, offset: 0 }
        ],
        uniforms: [
            { name: 's', size: 1, type: 'i', value: 0 },
            { name: 't', size: 1, type: 'f', value: 0 },
            { name: 'q', size: 1, type: 'f', value: 0 }
        ]
    });
    const postProcessRenderTarget = Renderer.createRenderTarget(canvas.width, canvas.height, true);

    const menuCamera = Camera.make([0, 0, -50], Mat4.makePersp(degToRad(20), canvas.width / canvas.height, 10, 1000));

    const gameCamera = Camera.make([0, 5, 20], Mat4.makePersp(degToRad(20), canvas.width / canvas.height, 10, 1000));
    const quadMesh = MeshBuilder.createQuadWithUVs(10, 5);
    quadMesh.setFaceCulling(0);

    const fullScreenMesh = MeshBuilder.createQuad(1, 1);
    fullScreenMesh.setFaceCulling(0);

    const treeBottomStaticMesh = Renderer.createStaticMesh(treeBottomData.vertices, treeBottomData.vertexCount);
    const treeTopStaticMesh = Renderer.createStaticMesh(treeTopData.vertices, treeTopData.vertexCount);
    const grassStaticMesh = Renderer.createStaticMesh(grassData.vertices, grassData.vertexCount);
    const housetreeTopStaticMesh = Renderer.createStaticMesh(houseTopData.vertices, houseTopData.vertexCount);
    const housetreeBottomStaticMesh = Renderer.createStaticMesh(houseBottomData.vertices, houseBottomData.vertexCount);
    const sphereStaticMesh = MeshBuilder.createSphere(1, 20, 20);

    housetreeBottomStaticMesh.setFaceCulling(0);
    grassStaticMesh.setFaceCulling(0);

    Player.init(-5, 0, -5, grassStaticMesh);
    RataPatata.init(0, 0, -12, treeTopStaticMesh);
    Dialogues.init(Player.gameObject, RataPatata.gameObject);


    const staticGeometryList = [];

    {
        const houseTop = Engine.createGameObject(0, -1.8, -36, housetreeTopStaticMesh);
        houseTop.scale = 1.5;
        houseTop.rotation[1] = degToRad(90);
        const houseBottom = Engine.createGameObject(houseTop.position[0], houseTop.position[1], houseTop.position[2], housetreeBottomStaticMesh);
        houseBottom.scale = houseTop.scale;
        houseBottom.rotation[1] = houseTop.rotation[1];

        houseTop.color = Vec3.scale([74/255,90/255,110/255], 0.7);
        houseBottom.color = Vec3.scale([242/255, 165/255, 158/255], 1.2);
        houseTop.cullRadius = houseBottom.cullRadius = 10;

        staticGeometryList.push(houseTop, houseBottom);

        const housePhysics1 = Engine.createPhysicsObject(houseBottom, Engine.Physics.Collision.makeSphere([-4, 5, -5], 13));
        housePhysics1.usePhysics = false;
        housePhysics1.static = true;

        const housePhysics2 = Engine.createPhysicsObject(houseBottom, Engine.Physics.Collision.makeSphere([-11, 4, 14], 4));
        housePhysics2.usePhysics = false;
        housePhysics2.static = true;

        const housePhysics3 = Engine.createPhysicsObject(houseBottom, Engine.Physics.Collision.makeSphere([11, 4, 14], 4));
        housePhysics3.usePhysics = false;
        housePhysics3.static = true;

        Engine.Physics.add(housePhysics1);
        Engine.Physics.add(housePhysics2);
        Engine.Physics.add(housePhysics3);
    }

    for (let index = 0; index < 100; ++index) {
        let ci = cos(index);
        let si = sin(index);
        if (abs(ci) < 0.65) ci = 0.0;
        if (abs(si) < 0.65) si = 0.0;
        const x = ci * 80 + (Math.random() * 2 - 1) * 20;
        const z = -10+si * 80 + (Math.random() * 2 - 1) * 20;
        const bottom = Engine.createGameObject(x, -1, z, treeBottomStaticMesh);
        bottom.color = [ 
            (Math.random() * 0.3) + (41/255),
            (Math.random() * 0.1) + (18/255),
            (Math.random() * 0.1) + (0/255)
        ]
        bottom.rotation[1] = Math.random() * Math.PI * 2;
        bottom.scale = 2.8;

        const top = Engine.createGameObject(bottom.position[0], bottom.position[1], bottom.position[2], treeTopStaticMesh);
        top.color = [
            (Math.random() * 0.1) + (230/255),
            (Math.random() * 0.3) + (20/255),
            (Math.random() * 0.05) + (20/255)
        ]
        top.rotation[1] = bottom.rotation[1];
        top.scale = bottom.scale;
        top.cullRadius = 2;

        const treePhysics = Engine.createPhysicsObject(bottom, Engine.Physics.Collision.makeSphere([0, 4, 0], 1.5));
        treePhysics.usePhysics = false;
        treePhysics.static = true;
        Engine.Physics.add(treePhysics);

        staticGeometryList.push(bottom, top);
    }

    for (let index = 0; index < 400; ++index) {
        const x = cos(index) * 180 + (Math.random() * 2 - 1) * 80;
        const z = sin(index) * 180 + (Math.random() * 2 - 1) * 80;
        const bottom = Engine.createGameObject(x, -1, z, treeBottomStaticMesh);
        bottom.color = [ 
            (Math.random() * 0.3) + (41/255),
            (Math.random() * 0.1) + (18/255),
            (Math.random() * 0.1) + (0/255)
        ]
        bottom.rotation[1] = Math.random() * Math.PI * 2;
        bottom.scale = 2.8;

        const top = Engine.createGameObject(bottom.position[0], bottom.position[1], bottom.position[2], treeTopStaticMesh);
        top.color = [
            (Math.random() * 0.1) + (230/255),
            (Math.random() * 0.3) + (20/255),
            (Math.random() * 0.05) + (20/255)
        ]
        top.rotation[1] = bottom.rotation[1];
        top.scale = bottom.scale;
        top.cullRadius = 2;

        const treePhysics = Engine.createPhysicsObject(bottom, Engine.Physics.Collision.makeSphere([0, 4, 0], 1.5));
        treePhysics.usePhysics = false;
        treePhysics.static = true;
        Engine.Physics.add(treePhysics);

        staticGeometryList.push(bottom, top);
    }

    for (let index = 0; index < 500; ++index) {
        const x = cos(index) * 260 + (Math.random()) * 30;
        const z = sin(index) * 260 + (Math.random()) * 30;
        const bottom = Engine.createGameObject(x, -1, z, treeBottomStaticMesh);
        bottom.color = [ 
            (Math.random() * 0.3) + (41/255),
            (Math.random() * 0.1) + (18/255),
            (Math.random() * 0.1) + (0/255)
        ]
        bottom.rotation[1] = Math.random() * Math.PI * 2;
        bottom.scale = 2.8;

        const top = Engine.createGameObject(bottom.position[0], bottom.position[1], bottom.position[2], treeTopStaticMesh);
        top.color = [
            (Math.random() * 0.1) + (230/255),
            (Math.random() * 0.3) + (20/255),
            (Math.random() * 0.05) + (20/255)
        ]
        top.rotation[1] = bottom.rotation[1];
        top.scale = bottom.scale;
        top.cullRadius = 2;

        const treePhysics = Engine.createPhysicsObject(bottom, Engine.Physics.Collision.makeSphere([0, 4, 0], 1.5));
        treePhysics.usePhysics = false;
        treePhysics.static = true;
        Engine.Physics.add(treePhysics);

        staticGeometryList.push(bottom, top);
    }

    for (let index = 0; index < 800; ++index) {
        const x = cos(index) * 80 + (Math.random() * 2 - 1) * 40;
        const z = sin(index) * 80 + (Math.random() * 2 - 1) * 40 - 30;
        const grass = Engine.createGameObject(x, 0, z, grassStaticMesh);
        grass.color = [ 
            (Math.random() * 0.2) + (28/255),
            (Math.random() * 0.3) + (41/255),
            (Math.random() * 0.1) + (20/255)
        ]
        grass.rotation[1] = Math.random() * Math.PI * 2;
        grass.scale = 2;

        staticGeometryList.push(grass);
    }

    for (let index = 0; index < 800; ++index) {
        const x = cos(index) * 180 + (Math.random() * 2 - 1) * 70;
        const z = sin(index) * 180 + (Math.random() * 2 - 1) * 70;
        const grass = Engine.createGameObject(x, 0, z, grassStaticMesh);
        grass.color = [ 
            (Math.random() * 0.2) + (28/255),
            (Math.random() * 0.3) + (41/255),
            (Math.random() * 0.1) + (20/255)
        ]
        grass.rotation[1] = Math.random() * Math.PI * 2;
        grass.scale = 2;

        staticGeometryList.push(grass);
    }

    Dialogues.onComplete = (dialogueIndex) => {
        if (dialogueIndex === 0) {
            generateCollectableItems(gameItems.timber);
        } else if (dialogueIndex === 1) {
            setTimeout(() => {
                RataPatata.walkToHouse = true;
            }, 1000);
            generateCollectableItems(gameItems.apples);
        } else if (dialogueIndex === 2) {
            generateCollectableItems(gameItems.mint);
        } else if (dialogueIndex === 3) {
            sampleElement = null;
            gameItems.current = gameItems.tmp;
            RataPatata.walkToHouse = true;
            isTheEnd = true;
            time = 1;
            Player.blockInput = true;
        } else {
            gameItems.current = null;
        }
    };

    const clearCollectableItems = () => {
        collectableItems.forEach((o) => {
            if (o && o.physicsObjects) {
                o.physicsObjects.forEach((p) => {
                    Engine.Physics.remove(p);
                });
            }
        });
        collectableItems.length = 0;
    };

    const generateCollectableItems = (itemsData) => {
        clearCollectableItems();
        gameItems.current = itemsData;
        sampleElement = Engine.createGameObject(0, 0, -12, itemsData.staticMesh);
        sampleElement.rotation[2] = degToRad(45);
        sampleElement.color = itemsData.color;

        for (let index = 0; index < itemsData.needed * itemsData.neededScale; ++index) {
            const r = index + Math.random() * PI;
            const x = cos(r) * itemsData.radiusMin + Math.random() * (itemsData.radiusMax - itemsData.radiusMin);
            const z = sin(r) * itemsData.radiusMin + Math.random() * (itemsData.radiusMax - itemsData.radiusMin);
            const gameObject = Engine.createGameObject(x, 0, z, itemsData.staticMesh);
            const physicsObject = Engine.createPhysicsObject(gameObject, Engine.Physics.Collision.makeSphere([0, 0, 0], 2));
            gameObject.rotation[2] = degToRad(45);
            gameObject.color = itemsData.color;
            gameObject.cullRadius = 1.5;
            physicsObject.usePhysics = false;
            physicsObject.onObjectCollision = (other) => {
                if (other === Player.physicsObject) {
                    Engine.Physics.remove(physicsObject);
                    collectableItems.splice(collectableItems.indexOf(physicsObject.gameObject), 1);
                    itemsData.count += 1;
                    zzfxV=0.05;
                    if (itemsData.count === itemsData.needed) {
                        clearCollectableItems();
                        zzfx(...[,,625,,.08,.26,,1.61,,,548,.09,,.1,,,.02,.89,.03]);
                        setTimeout(() => {
                            zzfxV=0.05;
                            zzfx(...[,,20,.31,.34,.77,,1.1,,,-226,,.23,,.1,.1,.19,.77,.01,.4]);
                        }, 30);
                    } else {
                        zzfx(...[,,625,,.08,.26,,1.61,,,548,.09,,.1,,,.02,.89,.03]);
                    }
                }
            };
            Engine.Physics.add(physicsObject);
            collectableItems.push(gameObject);
        }
    };

    const houseSmoke = SmokeEmitter.create([8, 23, -31], sphereStaticMesh, [2, 2, 2]);


    const updateGame = ()=> {
        Input.gamepadUpdate();
        Player.update();
        RataPatata.update();

        gameCamera.update();

        Engine.Physics.update(Terrain.physicsFunc);
        Engine.Physics.updateGameObjects();
        if (f < 20) f += 0.1;
        
        if (RataPatata.startChimenea) {
            houseSmoke.update();
        }

        if (time > 0.8) {
            Dialogues.update();
        }

        collectableItems.forEach((o, index) => {
            o.position[1] = 2 + sin(time * 2 + index);
            o.scale = 1 + abs(sin(time*2+index)) * 0.5;
            o.rotation[0] += 0.05;
            o.rotation[1] += 0.05;
        });

        if (Dialogues.isDone() && sampleElement) {
            sampleElement.position[0] = RataPatata.gameObject.position[0];
            sampleElement.position[2] = RataPatata.gameObject.position[2];
            sampleElement.position[1] = 15 + sin(time * 2);
            sampleElement.scale = 1 + abs(sin(time*2)) * 0.5;
            sampleElement.rotation[0] += 0.05;
            sampleElement.rotation[1] += 0.05;
        }

        if(Vec3.dist(Player.gameObject.position, RataPatata.gameObject.position) < 12) {
            if (gameItems.current && gameItems.current !== gameItems.tmp && Dialogues.isDone() && gameItems.current.count >= gameItems.current.needed) {
                if (gameItems.current.nextDialogueIndex > 0) {
                    const angle = atan2(RataPatata.gameObject.position[2] - Player.gameObject.position[2], RataPatata.gameObject.position[0] - Player.gameObject.position[0]);
                    Player.gameObject.rotation[1] = angle- degToRad(90);
                    Player.physicsObject.velocity[0] = 0;
                    Player.physicsObject.velocity[2] = 0;
                    Dialogues.setDialogue(gameItems.current.nextDialogueIndex);
                }
            }
        }
    };

    let renderStatus = null;
    let time = 0.38;
    let startEasing = false;
    let waitTime = 1;
    let isFirstFrame = true;
    let yScale = 0.0;
    let focusPoint = -0.025;
    const centerGameObject = Engine.createGameObject(0, 6, -5, null);
    let focusOnPlayer = false;
    let f = 5.0;
    let offset = 80;
    const renderGame = ()=> {
        #if DEBUG
        ProfilerGL.beginFrame();
        #endif
        if (startPlayingGame) {
            const canAdjust = !isTheEnd && Dialogues.isDone();
            if (canAdjust && (Input.Keyboard.down(83) || (gamepad && gamepad.buttons[6].pressed))) {
                if (yScale > -0.5) {
                    yScale -= 0.03;
                }
                if (focusPoint < 0.005) {
                    focusPoint += 0.001;
                }
            } else if (canAdjust && (Input.Keyboard.down(68) || (gamepad && gamepad.buttons[7].pressed))) {
                if (yScale < 0.5) {
                    yScale += 0.03;
                }
                if (focusPoint > -0.008) {
                    focusPoint -= 0.001;
                }
            } else {
                yScale *= 0.8;
                focusPoint *= 0.5;
            }
        }

        if (focusOnPlayer) {
            gameCamera.followGameObject(Player.gameObject, [offset, offset*(1-yScale), offset]);
        } else {
            if (startPlayingGame) {
                const dir = Vec3.norm(Vec3.sub(Player.gameObject.position, centerGameObject.position));
                centerGameObject.position = Vec3.add(centerGameObject.position, Vec3.scale(dir, 0.05));
                if (Vec3.dist(Player.gameObject.position, centerGameObject.position) < 0.1) {
                    focusOnPlayer = true;
                }
            }
            gameCamera.followGameObject(centerGameObject, [offset, offset*(1-yScale), offset]);

        }
        if (startPlayingGame) {
            if (offset < 120) {
                offset += 1;
            }
        }

        gameCamera.update();
        let culledElements = gameCamera.cull(staticGeometryList, 160);

        if (isFirstFrame) {
            // Render static geometry to static shadow map
            ShadowMap.beginFrame(false);
            Terrain.render();
            staticGeometryList.forEach((o) => Renderer.drawGameObject(o));
            ShadowMap.endFrame();
            isFirstFrame = false;
        }

        // Render dynamic geometry to dynamic shadow map
        ShadowMap.beginFrame(true);
        Player.render();
        RataPatata.render();

        if (RataPatata.startChimenea) houseSmoke.render();

        collectableItems.forEach((o) => Renderer.drawGameObject(o));

        if (Dialogues.isDone() && sampleElement) Renderer.drawGameObject(sampleElement);

        const shadowMatrix = ShadowMap.endFrame();

        // Render Scene
        Renderer.beginFrame(postProcessRenderTarget);
        Renderer.clearFrame(0.7, 0.8, 0.9, 1);
        Renderer.setPipeline(scenePipeline);
        Renderer.setCamera(gameCamera);
        Renderer.setUniformValue('l', Vec3.norm(ShadowMap.lightDir));
        Renderer.setUniformValue('n', shadowMatrix);
        Renderer.setUniformValue('g', Terrain.gameObject.color);
        Renderer.setTextureAt(ShadowMap.renderTarget.texture, 0);
        Renderer.setTextureAt(ShadowMap.staticRenderTarget.texture, 1);
        Terrain.render();

        #if DEBUG
        #define RENDER_COLLISION 0

        #if RENDER_COLLISION

        const renderCollider = (physicsObject) => {
            const rs = physicsObject.collider.radius * (physicsObject.gameObject.position ? physicsObject.gameObject.scale : 1.0);
            Renderer.drawMesh(sphereStaticMesh, Mat4.scale(Mat4.trans(Mat4.makeIdent(), Vec3.add(physicsObject.position, physicsObject.collider.position)), [rs, rs, rs]), [1, 1, 1]);
        };
        renderCollider(Player.physicsObject);
        renderCollider(RataPatata.physicsObject);
        culledElements.forEach((o) => {
            if (o.physicsObjects.length > 0) {
                o.physicsObjects.forEach((p) => renderCollider(p));
            }
        });
        #else
        Player.render();
        RataPatata.render();
        culledElements.forEach((o) => Renderer.drawGameObject(o));
        if (RataPatata.startChimenea) houseSmoke.render();
        #endif
        #else
        Player.render();
        RataPatata.render();
        culledElements.forEach((o) => Renderer.drawGameObject(o));
        if (RataPatata.startChimenea) houseSmoke.render();
        #endif

        collectableItems.forEach((o) => Renderer.drawGameObject(o));
        if (Dialogues.isDone() && sampleElement) Renderer.drawGameObject(sampleElement);

        renderStatus = Renderer.endFrame();


        Renderer.beginFrame();
        Renderer.setPipeline(postProcessPipeline);
        postProcessPipeline.setUniformValue('t', time);
        postProcessPipeline.setUniformValue('q', focusPoint);
        Renderer.setTextureAt(postProcessRenderTarget.texture, 0);
        Renderer.drawMesh(fullScreenMesh, Mat4.makeIdent(), [1, 1, 1]);

        Renderer.setPipeline(texturedPipeline);
        gl.disable(gl.DEPTH_TEST);
        Dialogues.render();
        Player.renderText(gameItems);
        gl.enable(gl.DEPTH_TEST);

        Renderer.endFrame();
        #if DEBUG
        ProfilerGL.endFrame();
        #endif
    };

    #if DEBUG
    const frameTimePre = document.createElement('pre');
    document.body.appendChild(frameTimePre);
    #endif
    let gamepad = null;
    const mainLoop = (currentTime) => {
        #if DEBUG
        const beginFrame = performance.now();
        #endif
        gamepad = Input.getGamepad();
        Engine.lastTime = Engine.currentTime;
        Engine.currentTime = currentTime;
        updateGame();
        renderGame();
        #if DEBUG
        const endFrame = performance.now();
        const frameDelta = (endFrame - beginFrame);
        frameTimePre.innerText = `
        CPU time: ${frameDelta.toFixed(2)} ms
        GPU time: ${ProfilerGL.getElapsed().toFixed(2)} ms
        Draw Calls: ${renderStatus.drawCalls}
        Tri. Count: ${(renderStatus.vertexCount)/3}
        `;
        fpsMeter.tick();
        #endif
        if (startPlayingGame && !isTheEnd)
            time += 0.005;
        else if (isTheEnd) {
            if (time > 0) {
                time -= 0.001;
            }
        }

        if (Input.Keyboard.click(40) || (gamepad && gamepad.buttons[0].pressed)) {
            startPlayingGame = true;
        }
            
        requestAnimationFrame(mainLoop);
    };

    const startGame = () => {
        mainLoop(0);
    };
    startGame();

};


const Camera = {
    make: (position, projectionMatrix) => {
        const cam = {
            position: position,
            front: [0, 0, -1],
            direction: [0, 0, 0],
            projectionMatrix: projectionMatrix,
            lookAtTarget: null,
            lookAtOffset: [0, 0, 0],
            update: () => {
                if (cam.lookAtTarget) {
                    cam.position[0] = cam.lookAtTarget.position[0] + cam.lookAtOffset[0];
                    cam.position[1] = /*cam.lookAtTarget.position[1] +*/ cam.lookAtOffset[1];
                    cam.position[2] = cam.lookAtTarget.position[2] + cam.lookAtOffset[2];
                }
            },
            getLookAtDir: () => {
                if (cam.lookAtTarget) {
                    return Vec3.norm(Vec3.sub(cam.lookAtTarget.position, cam.position));
                } else {
                    return cam.front;
                }
            },
            pointToDirection: (dir) => {
                cam.direction = dir;
                cam.front = Vec3.norm(cam.direction);
            },
            followGameObject: (gameObject, offset) => {
                cam.lookAtTarget = gameObject;
                cam.lookAtOffset = offset;
            },
            cull: (list, cameraRadius) => {
                const culledElements = [];
                const lookAtDir = cam.getLookAtDir();
                const collisionSpherePosition = Vec3.add(cam.position, Vec3.scale(lookAtDir, cameraRadius * 1.5));

                list.forEach((obj) => {
                    const objRadius = obj.cullRadius * obj.scale;
                    const dist = Vec3.dist(obj.position, collisionSpherePosition);
                    const rad = (objRadius + cameraRadius);
                    if (dist < rad) {
                        culledElements.push(obj);
                    }
                });
                
                return culledElements;
            }
        };
        return cam;
    }
};
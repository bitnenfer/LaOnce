const MeshBuilder = {
    createQuad: (width, height) => {
        return Renderer.createStaticMesh(new Float32Array([
            -width, +height, 0, -width, -height, 0, +width, -height, 0,
            -width, +height, 0, +width, -height, 0, +width, +height, 0
        ]), 6);
    },
    createQuadWithUVs: (width, height) => {
        return Renderer.createStaticMesh(new Float32Array([
            -width, +height, 0, /* -- */ 0, 0,
            -width, -height, 0, /* -- */ 0, 1,
            +width, -height, 0, /* -- */ 1, 1,
            -width, +height, 0, /* -- */ 0, 0,
            +width, -height, 0, /* -- */ 1, 1,
            +width, +height, 0, /* -- */ 1, 0
        ]), 6);
    },
    createCube: (width, height, depth) => {
        const hw = width, hh = height, hd = depth;
        return Renderer.createStaticMesh(new Float32Array([
            -hw, +hh, -hd, /* -- */ -hw, -hh, -hd, /* -- */ +hw, -hh, -hd,
            -hw, +hh, -hd, /* -- */ +hw, -hh, -hd, /* -- */ +hw, +hh, -hd,
            -hw, +hh, +hd, /* -- */ -hw, -hh, +hd, /* -- */ +hw, -hh, +hd,
            -hw, +hh, +hd, /* -- */ +hw, -hh, +hd, /* -- */ +hw, +hh, +hd,
            +hw, +hh, -hd, /* -- */ +hw, -hh, -hd, /* -- */ +hw, -hh, +hd,
            +hw, +hh, -hd, /* -- */ +hw, -hh, +hd, /* -- */ +hw, +hh, +hd,
            -hw, +hh, -hd, /* -- */ -hw, -hh, -hd, /* -- */ -hw, -hh, +hd,
            -hw, +hh, -hd, /* -- */ -hw, -hh, +hd, /* -- */ -hw, +hh, +hd,
            -hw, -hh, +hd, /* -- */ -hw, -hh, -hd, /* -- */ +hw, -hh, -hd,
            -hw, -hh, +hd, /* -- */ +hw, -hh, -hd, /* -- */ +hw, -hh, +hd,
            -hw, +hh, +hd, /* -- */ -hw, +hh, -hd, /* -- */ +hw, +hh, -hd,
            -hw, +hh, +hd, /* -- */ +hw, +hh, -hd, /* -- */ +hw, +hh, +hd
        ]), 36).setFaceCulling(0);
    },
    createSphere: (radius, widthSegments, heightSegments) => {
        const uniqueVertices = [];
        const vertices = [];
        const PI2 = PI * 2;
        const grid = [];
        let idx = 0;
        // Sphere Generation From ThreeJS: https://github.com/mrdoob/three.js/blob/master/src/geometries/SphereGeometry.js#L79
        for (let y = 0; y <= heightSegments; ++y) {
            const v = y / heightSegments;
            const row = [];
            for (let x = 0; x <= widthSegments; ++x) {
                const u = x / widthSegments;
                const vx = -radius * cos(u * PI2) * sin(v * PI);
                const vy = radius * cos(v * PI);
                const vz = radius * sin(u * PI2) * sin(v * PI);
                uniqueVertices.push(vx, vy, vz);
                row.push(idx++);
            }
            grid.push(row);
        }
        const indices = [];
        for ( let iy = 0; iy < heightSegments; iy ++ ) {
            for ( let ix = 0; ix < widthSegments; ix ++ ) {
                const a = grid[ iy ][ ix + 1 ] * 3;
                const b = grid[ iy ][ ix ] * 3;
                const c = grid[ iy + 1 ][ ix ] * 3;
                const d = grid[ iy + 1 ][ ix + 1 ] * 3;
                if ( iy !== 0) {
                    vertices.push(
                        uniqueVertices[a + 0],
                        uniqueVertices[a + 1],
                        uniqueVertices[a + 2]
                    );
                    vertices.push(
                        uniqueVertices[b + 0],
                        uniqueVertices[b + 1],
                        uniqueVertices[b + 2]
                    );
                    vertices.push(
                        uniqueVertices[d + 0],
                        uniqueVertices[d + 1],
                        uniqueVertices[d + 2]
                    );
                }
                if ( iy !== heightSegments - 1) {
                    vertices.push(
                        uniqueVertices[b + 0],
                        uniqueVertices[b + 1],
                        uniqueVertices[b + 2]
                    );
                    vertices.push(
                        uniqueVertices[c + 0],
                        uniqueVertices[c + 1],
                        uniqueVertices[c + 2]
                    );
                    vertices.push(
                        uniqueVertices[d + 0],
                        uniqueVertices[d + 1],
                        uniqueVertices[d + 2]
                    );
                } 
            }
        }
        return Renderer.createStaticMesh(new Float32Array(vertices), vertices.length / 3);
    }
};
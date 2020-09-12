/* This originally was a function based terrain, but I went with a smaller solution and changing everything back was too much work */
const Terrain = {
    size: 0,
    sizePhysics: 0,
    mesh: null,
    meshSegments: 2,
    gameObject: null,
    init: (size) => {
        Terrain.size = size;
        Terrain.sizePhysics = size * 2;
        Terrain.mesh = MeshBuilder.createCube(size, 0.1, size);//MeshBuilder.createPlane(Terrain.size, Terrain.size, Terrain.meshSegments, Terrain.meshSegments, Terrain.func);
        Terrain.gameObject = Engine.createGameObject(0, -1, 0, Terrain.mesh);
        Terrain.gameObject.color = [2.6*(26/255),2.5*(41/255),2.2*(20/255)]
    },
    render: () => {
        Renderer.drawGameObject(Terrain.gameObject);
    }
};
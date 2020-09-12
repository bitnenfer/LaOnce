const ShadowMap = {
    size: 0,
    camera: null,
    renderTarget: null,
    staticRenderTarget: null,
    textureSize: 0,
    lightDir: null,
    pipeline: null,
    init: (gl, lightDir, size, textureSize) => {
        ShadowMap.lightDir = lightDir;
        ShadowMap.size = size;
        ShadowMap.textureSize = textureSize;
        ShadowMap.camera = Camera.make(lightDir, Mat4.makeOrtho(-size, size, -size, size,-500, 500));
        ShadowMap.renderTarget = Renderer.createRenderTarget(textureSize, textureSize, true);
        ShadowMap.staticRenderTarget = Renderer.createRenderTarget(textureSize, textureSize, true);
        ShadowMap.pipeline = Renderer.createPipeline({
            vs: `%{shaders/shadow.vs}`,
            fs: `%{shaders/shadow.fs}`,
            vertexLayout: [
                { name: 'p', size: 3, type: 5126, stride: 0, offset: 0 }
            ],
            uniforms: [
                { name: 'm', size: 4, type: 'f', value: Mat4.makeIdent(), isMatrix: true }
            ]
        });
    },
    beginFrame: (renderToDynamicBuffer) => {
        ShadowMap.camera.pointToDirection(Vec3.norm(ShadowMap.lightDir));
        if (renderToDynamicBuffer)
            Renderer.beginFrame(ShadowMap.renderTarget);
        else 
            Renderer.beginFrame(ShadowMap.staticRenderTarget);
        Renderer.clearFrame(1, 0, 0, 1);
        Renderer.setPipeline(ShadowMap.pipeline);
        Renderer.setCamera(ShadowMap.camera);
    },
    endFrame: () => {
        Renderer.endFrame();
        return Renderer.viewProjectionMatrix;
    }
};
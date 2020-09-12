const Renderer = {
    currentPipeline: null,
    viewMatrix: null,
    projectionMatrix: null,
    viewProjectionMatrix: null,
    extensions: {},
    defaultRenderTarget: {
        texture: null,
        framebuffer: null,
        renderbuffer: null
    },
    #if DEBUG
    renderCount: 0,
    renderVertexCount: 0,
    #endif
    init: () => {
        Renderer.viewMatrix = Mat4.makeIdent();
        Renderer.projectionMatrix = Mat4.makeIdent();
        Renderer.viewProjectionMatrix = Mat4.makeIdent();
        gl.getSupportedExtensions().forEach((name) => {
            Renderer.extensions[name] = gl.getExtension(name);
        });
        gl.enable(gl.DEPTH_TEST);

    },
    setCamera: (cam) => {
        Renderer.projectionMatrix = cam.projectionMatrix;
        if (cam.lookAtTarget) {
            Renderer.lookAt(cam.position, cam.lookAtTarget.position);
        } else {
            Renderer.lookAt(cam.position, Vec3.add(cam.position, cam.front));
        }
    },
    setTextureAt: (texture, unit) => {
        gl.activeTexture(33984 + unit);
        gl.bindTexture(3553, texture);
    },
    lookAt: (cameraPosition, positionToLookAt) => {
        Renderer.viewMatrix = Mat4.lookAt(cameraPosition, positionToLookAt, [0, 1, 0]);
        Renderer.viewProjectionMatrix = Mat4.mul(Renderer.viewMatrix, Renderer.projectionMatrix);
    },
    beginFrame: (renderTarget) => {
        Renderer.currentPipeline = null;
        if (renderTarget) {
            gl.bindFramebuffer(36160, renderTarget.framebuffer);
            gl.viewport(0, 0, renderTarget.width, renderTarget.height);
        } else {
            gl.bindFramebuffer(36160, null);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
        #if DEBUG
        Renderer.renderCount = 0;
        Renderer.renderVertexCount = 0;
        #endif
    },
    endFrame: () => {
        gl.bindFramebuffer(36160, null);
        gl.bindTexture(3553, null);
        #if DEBUG
        return { drawCalls: Renderer.renderCount, vertexCount: Renderer.renderVertexCount };
        #endif
    },
    clearFrame: (r, g, b, a) => {
        gl.clearColor(r, g, b, a);
        gl.clear(17664);
    },
    setPipeline: (pipeline) => {
        Renderer.currentPipeline = pipeline;
        gl.useProgram(pipeline.shaderProgram);
    },
    drawGameObject: (gameObject) => {
        if (gameObject.staticMesh !== null) {
            Renderer.drawMesh(gameObject.staticMesh, gameObject.getModelMatrix(), gameObject.color);
        }
    },
    setUniformValue: (name, value) => {
        if (Renderer.currentPipeline !== null) {
            Renderer.currentPipeline.setUniformValue(name, value);
        }
    },
    drawMesh: (mesh, modelMatrix, color) => {
        Renderer.currentPipeline.setUniformValue('b', modelMatrix);
        Renderer.currentPipeline.setUniformValue('m', Mat4.mul(modelMatrix, Renderer.viewProjectionMatrix));
        Renderer.currentPipeline.setUniformValue('c', color || [1, 1, 1]);
        Renderer.currentPipeline.uniformArray.forEach((uniform) => {
            if (uniform.isDirty) {
                let funcName = 'uniform';
                if (uniform.isMatrix) {
                    funcName += 'Matrix' + uniform.size + uniform.type + 'v';
                    gl[funcName](uniform.location, false, uniform.value);
                } else {
                    funcName += uniform.size + uniform.type;
                    if (Array.isArray(uniform.value) || ArrayBuffer.isView(uniform.value)) funcName += 'v';
                    gl[funcName](uniform.location, uniform.value);
                }
                uniform.isDirty = false;
            }
        });
        if (mesh.faceCulling > 0) {
            gl.enable(2884);
            gl.cullFace(mesh.faceCulling);
        } else {
            gl.disable(2884);
        }
        gl.bindBuffer(34962, mesh.gpuBuffer);
        Renderer.currentPipeline.bindAttributes();
        gl.drawArrays(Renderer.currentPipeline.primitiveType, 0, mesh.vertexCount);
        #if DEBUG
        Renderer.renderCount += 1;
        Renderer.renderVertexCount += mesh.vertexCount;
        #endif
    },
    compileShader: (src, type) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, '#extension GL_OES_standard_derivatives : enable\n' + 'precision highp float;'+ src);
        gl.compileShader(shader);
        #if DEBUG
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const infoLog = gl.getShaderInfoLog(shader);
            console.log(src);
            console.error((type === 35633 ? 'Vertex' : 'Fragment') + ' Shader Compilation Failed:\n', infoLog);
            return null;
        }
        #endif
        return shader;
    },
    createPipeline: (opts) => {
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, Renderer.compileShader(opts.vs, 35633));
        gl.attachShader(shaderProgram, Renderer.compileShader(opts.fs, 35632));
        gl.linkProgram(shaderProgram);
        #if DEBUG
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            const infoLog = gl.getProgramInfoLog(shaderProgram);
            console.error('Shader Program Linking Error:\n', infoLog);
            return null;
        }
        #endif
        gl.useProgram(shaderProgram);
        const attribLocations = [];
        const uniformLocations = {};
        const uniformArray = [];
        opts.vertexLayout.forEach((attrib)=> {
            attribLocations.push({
                location: gl.getAttribLocation(shaderProgram, attrib.name),
                size: attrib.size,
                type: attrib.type,
                normalized: !!attrib.normalized,
                stride: attrib.stride,
                offset: attrib.offset
            });
        });
        if (opts.uniforms) {
            opts.uniforms.forEach((uniform) => {
                const unf = {
                    location: gl.getUniformLocation(shaderProgram, uniform.name),
                    isMatrix: !!uniform.isMatrix,
                    size: uniform.size,
                    type: uniform.type,
                    value: uniform.value,
                    isDirty: true,
                    setValue: (newValue) => {
                        if (unf.value != newValue) {
                            unf.value = newValue;
                            unf.isDirty = true;
                            if (unf.value === undefined) debugger;
                        }
                    }
                };
                if (unf.value === undefined) debugger;
                uniformArray.push(unf);
                uniformLocations[uniform.name] = unf;
            });
        }
        
        const pipeline = {
            primitiveType: opts.primitiveType === undefined ? gl.TRIANGLES : opts.primitiveType, 
            shaderProgram: shaderProgram,
            attributes: attribLocations,
            uniforms: uniformLocations,
            uniformArray: uniformArray,
            setUniformValue: (name, value) => {
                if (pipeline.uniforms.hasOwnProperty(name)) {
                    pipeline.uniforms[name].setValue(value);
                }
            },
            bindAttributes: () => {
                pipeline.attributes.forEach((attrib) => {
                    gl.enableVertexAttribArray(attrib.location);
                    gl.vertexAttribPointer(attrib.location, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
                });
            }
        };
        return pipeline;
    },
    createStaticMesh: (data, vertexCount, faceCulling) => {
        faceCulling = faceCulling === undefined ? gl.BACK : faceCulling;
        const buffer = gl.createBuffer();
        const array = new Float32Array(data);
        gl.bindBuffer(34962, buffer);
        gl.bufferData(34962, array, 35044);
        gl.bindBuffer(34962, null);
        const staticMesh = {
            gpuBuffer: buffer,
            cpuBuffer: array,
            vertexCount: vertexCount,
            faceCulling: faceCulling,
            setFaceCulling: (faceCulling) => {
                staticMesh.faceCulling = faceCulling;
                return staticMesh;
            }
        };
        return staticMesh;
    },
    createRenderTarget: (width, height, enableDepthStencil) => {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(36160, framebuffer);

        const texture = gl.createTexture();
        gl.activeTexture(33984);
        gl.bindTexture(3553, texture);
        gl.texParameteri(3553, 10241, 9729);
        gl.texParameteri(3553, 10240, 9729);
        gl.texParameteri(3553, 10242, 33071);
        gl.texParameteri(3553, 10243, 33071);
        gl.texImage2D(3553, 0, 6408, width, height, 0, 6408, 5126, null);

        let renderbuffer = null;
        if (enableDepthStencil) {
            renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(36161, renderbuffer);
            gl.renderbufferStorage(36161, 34041, width, height);
            gl.framebufferRenderbuffer(36160, 33306, 36161, renderbuffer);
        }

        gl.framebufferTexture2D(36160, 36064, 3553, texture, 0);

        #if DEBUG
        const complete = gl.checkFramebufferStatus(36160);

        if (complete !== gl.FRAMEBUFFER_COMPLETE)
        {
            var errors = {
                36054: 'Incomplete Attachment',
                36055: 'Missing Attachment',
                36057: 'Incomplete Dimensions',
                36061: 'Framebuffer Unsupported'
            };
            throw new Error('Framebuffer incomplete. Framebuffer status: ' + errors[complete]);
        }

        gl.bindTexture(3553, null);
        gl.bindFramebuffer(36160, null);
        #endif
        return {
            texture: texture,
            framebuffer: framebuffer,
            renderbuffer: renderbuffer,
            width: width,
            height: height
        };
    }
}; 
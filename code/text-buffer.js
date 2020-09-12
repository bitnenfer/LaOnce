const TextBuffer = {
    createTextBuffer: (width, height, initText, scale, fontSize) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'center';
        ctx.font = 'bold '+fontSize+'px monospace';

        const texture = gl.createTexture();
        gl.activeTexture(33984);
        gl.bindTexture(3553, texture);
        gl.texParameteri(3553, 10241, 9729);
        gl.texParameteri(3553, 10240, 9729);
        gl.texParameteri(3553, 10242, 33071);
        gl.texParameteri(3553, 10243, 33071);
        gl.texImage2D(3553, 0, 6408, 6408, 5121, canvas);

        const quadMesh = MeshBuilder.createQuadWithUVs(1, 1);
        ctx.strokeStyle = '#112233';
        ctx.lineWidth = 13.0;
        ctx.lineJoin  = 'round';
        const textRenderer = {
            texture: texture,
            canvas: canvas,
            ctx: ctx,
            mesh: quadMesh,
            setText: (text, textColor) => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (textColor) {
                    ctx.fillStyle = textColor;
                } else {
                    ctx.fillStyle = '#000';
                }
                
                ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                textRenderer.uploadToGPU();
            },
            uploadToGPU: () => {
                gl.activeTexture(33984);
                gl.bindTexture(3553, texture);
                gl.texSubImage2D(3553, 0, 0, 0, 6408, gl.UNSIGNED_BYTE, canvas);
            },
            render: (parentMatrix) => {
                const renderMatrix = Mat4.mul(Mat4.scale(Mat4.mul(Mat4.makeIdent(), Mat4.fromEuler([0.0, -degToRad(45), 0])), [width / scale, height / scale, 1]), parentMatrix);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  
                Renderer.setTextureAt(texture, 0);
                Renderer.drawMesh(quadMesh, renderMatrix, [1, 1, 1]);
                gl.disable(gl.BLEND);
            }
        };

        if (initText) {
            textRenderer.setText(initText);
            textRenderer.uploadToGPU();
        }

        return textRenderer;
    }
};
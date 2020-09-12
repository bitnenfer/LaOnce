const SmokeEmitter = {
    create: (position, mesh, color) => {
        let time = 0.0;
        const particles = [];
        const particleEmitter = {
            update: () => {
                const particlesToRemove = [];

                for (let index = 0; index < particles.length; ++index) {
                    const p = particles[index];
                    p.position = Vec3.add(p.position, p.velocity);
                    p.life -= 0.005;
                    p.scale = sin(p.life * PI) * 2;
                    if (p.life <= 0) {
                        particlesToRemove.push(index);
                    }
                }

                particlesToRemove.forEach((idx) => {
                    particles.splice(idx, 1);
                });

                if (time <= 0) {
                    particles.push({
                        position: position.slice(),
                        scale: 0,
                        color: color.slice(),
                        velocity: [(Math.random() * 2.0 - 1.0) * 0.02, 0.1, (Math.random() * 2.0 - 1.0) * 0.02],
                        life: 1
                    });
                    time = 1;
                }
                time -= 0.02;
            },
            render: () => {
                particles.forEach((p) => {
                    Renderer.drawMesh(mesh, Mat4.scale(Mat4.trans(Mat4.makeIdent(), p.position), [p.scale, p.scale, p.scale]), p.color);
                });
            }
        };

        return particleEmitter;
    }
};
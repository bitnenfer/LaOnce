const cos = Math.cos;
const sin = Math.sin;
const sqrt = Math.sqrt;
const abs = Math.abs;
const PI = Math.PI;
const tan = Math.tan;
const sign = Math.sign;
const random = Math.random;
const atan2 = Math.atan2;
const degToRad = (d) => d * PI / 180;
const Vec3 = {
    make: (x, y, z) => [x, y, z],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    dist: (a, b) => {
        return sqrt(
                (a[0] - b[0]) * (a[0] - b[0]) +
                (a[1] - b[1]) * (a[1] - b[1]) +
                (a[2] - b[2]) * (a[2] - b[2])
            );        
    },
    lenSqr: (a) => Vec3.dot(a, a),
    len: (a) => sqrt(Vec3.lenSqr(a)),
    add: (a, b) => [ a[0] + b[0], a[1] + b[1] , a[2] + b[2] ],
    sub: (a, b) => [ a[0] - b[0], a[1] - b[1] , a[2] - b[2] ],
    mul: (a, b) => [ a[0] * b[0], a[1] * b[1] , a[2] * b[2] ],
    div: (a, b) => [ a[0] / b[0], a[1] / b[1] , a[2] / b[2] ],
    scale: (v, s) => [ v[0] * s, v[1] * s, v[2] * s ],
    reflect: (a, n) => {
        const dp = 2 * Vec3.dot(a, n);
        const x = Vec3.scale(n, dp);
        const r = Vec3.sub(a, x);
        return r;
    },
    norm: (a) => {
        const len = Vec3.len(a);
        if (len != 0) {
            return [
                a[0] / len,
                a[1] / len,
                a[2] / len
            ];
        }
        return [
            a[0],
            a[1],
            a[2]
        ];
    }
};
const Mat4 = {
    make: (data) => data,
    makeIdent: () => [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ],
    lookAt: (eye, center, up) => {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        const E = 0.000001, 
            eyex = eye[0], 
            eyey = eye[1], 
            eyez = eye[2],
            upx = up[0], 
            upy = up[1], 
            upz = up[2],
            centerx = center[0], 
            centery = center[1], 
            centerz = center[2];
        if (abs(eyex - centerx) < E && abs(eyey - centery) < E && abs(eyez - centerz) < E) {
            return Mat4.makeIdent();
        }
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;
        len = 1 / sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (len === 0) {
            x0 = 0;
            x1 = 0; 
            x2 = 0;
        } else  {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;
        len = sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (len === 0) {
            y0 = 0;
            y1 = 0; 
            y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }
        return [
            x0, y0, z0, 0,
            x1, y1, z1, 0,
            x2, y2, z2, 0,
            -(x0 * eyex + x1 * eyey + x2 * eyez),
            -(y0 * eyex + y1 * eyey + y2 * eyez),
            -(z0 * eyex + z1 * eyey + z2 * eyez),
            1
        ];
    },
    makeOrtho: (left, right, bottom, top, nearBound, farBound) => {
        const lr = 1 / (left - right), bt = 1 / (bottom - top), nf = 1 / (nearBound - farBound);
        return [
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (top + bottom) * bt, (nearBound + farBound) * nf, 1
        ];
    },
    makePersp: (fov, aspect, nearBound, farBound) => {
        const f = 1 / tan(fov / 2), nf = 1 / (nearBound - farBound);
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (farBound + nearBound) * nf, -1,
            0, 0, (2 * farBound * nearBound) * nf, 0
        ];
    },
    mul: (b, a) => [
        b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12],
        b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13], 
        b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14], 
        b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15],
        b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12],
        b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13], 
        b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14], 
        b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15],
        b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12],
        b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13], 
        b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14], 
        b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15],
        b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12],
        b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13], 
        b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14], 
        b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15]
    ],
    trans: (m, v) => [
        m[0], m[1], m[2], m[3],
        m[4], m[5], m[6], m[7],
        m[8], m[9], m[10], m[11],
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], 
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], 
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14], 
        m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15]
    ],
    scale: (m, v) => [
        m[0] * v[0], m[1] * v[0], m[2] * v[0], m[3] * v[0],
        m[4] * v[1], m[5] * v[1], m[6] * v[1], m[7] * v[1],
        m[8] * v[2], m[9] * v[2], m[10] * v[2], m[11] * v[2],
        m[12], m[13], m[14], m[15]
    ],
    rotX: (m, r) => {
        const c = cos(r), s = sin(r);
        return [
            m[0], m[1], m[2], m[3],
            m[4] * c + m[8] * s, m[5] * c + m[9] * s, m[6] * c + m[10] * s, m[7] * c + m[11] * s,
            m[8] * c - m[4] * s, m[9] * c - m[5] * s, m[10] * c - m[6] * s, m[11] * c - m[7] * s,
            m[12], m[13], m[14], m[15]
        ];
    },
    // euler = [ yaw, pitch, roll ]
    // I know this is messed up, don't kill me.
    fromEuler: (euler) => {
        const cb = cos(euler[0]);
        const sb = sin(euler[0]);
        const ch = cos(euler[1]);
        const sh = sin(euler[1]);
        const ca = cos(euler[2]);
        const sa = sin(euler[2]);
        return [
            ch * ca, sh*sb - ch*sa*cb, ch*sa*sb + sh*cb, 0,
            sa, ca*cb, -ca*sb, 0,
            -sh*ca, sh*sa*cb + ch*sb, -sh*sa*sb + ch*cb, 0,
            0, 0, 0, 1
        ];
    }
};
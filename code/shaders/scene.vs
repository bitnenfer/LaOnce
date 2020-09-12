attribute vec3 p;
uniform mat4 m;
uniform mat4 n;
uniform mat4 b;
varying vec4 t;
varying vec4 x;
varying vec3 q;
void main() {
    gl_Position = m * vec4(p, 1);
    x = b * vec4(p, 1);
    t = n * x;
    q = p;
}
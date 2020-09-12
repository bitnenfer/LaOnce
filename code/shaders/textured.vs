attribute vec3 p;
attribute vec2 v;
uniform mat4 m;
varying vec2 t;
void main() {
    gl_Position = m * vec4(p, 1);
    t = v;
}
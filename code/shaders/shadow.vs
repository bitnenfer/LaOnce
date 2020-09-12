attribute vec3 p;
uniform mat4 m;
void main() {
    gl_Position = m * vec4(p, 1);
}
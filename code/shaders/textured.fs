uniform sampler2D s;
varying vec2 t;
void main() {
    vec4 c = texture2D(s, t);
    vec3 color = c.rgb * c.a;
    gl_FragColor = vec4(clamp((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0), c.a);
}
uniform vec3 c;
uniform vec3 g;
uniform sampler2D s;
uniform sampler2D d;
uniform vec3 l;
varying vec4 t;
varying vec4 x;
void main() {
    vec3 uv = (t.xyz / t.w) * .5 + .5;
    float shadow = min(texture2D(s, uv.xy).r,texture2D(d, uv.xy).r) < uv.z - 0.00001 ? 0.01 : 1.0;
    vec2 pixelSize = 0.3 / vec2(900, 540);
    float samples = 1.0;
    for (float r = 0.0; r < 6.28; r += 0.8) {
        vec2 cs = vec2(cos(r), sin(r)) * pixelSize;
        shadow += min(texture2D(s, uv.xy + cs).r,texture2D(d, uv.xy + cs).r) < uv.z - 0.001 ? 0.02 : 1.0;
        samples += 1.0;
    }
    shadow /= samples;
    vec3 n = normalize(cross(dFdy(x.xyz), dFdx(x.xyz)));
    float dp = max(dot(n, l), 0.0);
    vec3 diff = vec3(0.1, 0.1, 0.2) + (c * mix(0.7, 0.4, dp)) + (c * dp * shadow);
    vec3 bounce = (g * 0.8) * max(dot(n, vec3(0, 1, 0)), 0.0);
    diff += bounce;
    diff = diff * mix(vec3(1.2,1,1.2), vec3(1), sqrt(dp * shadow));
    gl_FragColor = vec4(diff, gl_FragCoord.z);
}
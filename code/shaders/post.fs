uniform sampler2D s;
uniform float t;
uniform float q;
void main() {
    vec2 uv = gl_FragCoord.xy / vec2(900, 540);
    vec4 sample = texture2D(s, uv);
    vec3 color = sample.rgb;
    float depth = sample.w;
    float focusPoint = 0.962 + q;
    float focusScale = 20.0;
    float blurSize = abs(clamp((1.0 / focusPoint - 1.0 / depth)*focusScale, -1.0, 1.0));
    vec2 pixelSize = 14. / vec2(900, 540);
    float samples = 1.0;
    for (float r = 0.0; r < 6.28; r += 0.6) {
        blurSize = abs(clamp((1.0 / focusPoint - 1.0 / texture2D(s, uv + (vec2(cos(r), sin(r)) * pixelSize * blurSize)).w)*focusScale, -1.0, 1.0));
        vec2 cs = vec2(cos(r), sin(r)) * pixelSize * blurSize;
        color += texture2D(s, uv.xy + cs).rgb;
        samples += 1.0;
    }
    color /= samples;
    vec3 aces = clamp((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0);
    if (t >= .25 && t < 1.0) {
        float n = ((t - .25) / 5.0);
        vec2 p = (uv * 2.0 - 1.0);
        p.x *= 900.0 / 540.0;
        aces = mix(vec3(242./255., 213./255., 227./255.), aces, smoothstep(length(p), n*25.0, 5.0));
    } else if (t < .25) {
        aces = vec3(242./255., 213./255., 227./255.);
    }
    gl_FragColor = vec4(aces, 1);
}
const ProfilerGL = {
    ext: null,
    gl: null,
    query: null,
    queryDone: true,
    lastQueryResult: 0,
    init: (_gl) => {
        if (!ProfilerGL.query && _gl.getSupportedExtensions().indexOf('EXT_disjoint_timer_query') > -1) {
            ProfilerGL.gl = _gl;
            ProfilerGL.ext = ProfilerGL.gl.getExtension('EXT_disjoint_timer_query');
            ProfilerGL.query = ProfilerGL.ext.createQueryEXT();
        }
    },
    beginFrame: () => {
        if (ProfilerGL.queryDone && ProfilerGL.ext) {
            ProfilerGL.ext.beginQueryEXT(ProfilerGL.ext.TIME_ELAPSED_EXT, ProfilerGL.query);
        }
    },
    endFrame: () => {
        if (ProfilerGL.queryDone && ProfilerGL.ext) {
            ProfilerGL.queryDone = false;
            ProfilerGL.ext.endQueryEXT(ProfilerGL.ext.TIME_ELAPSED_EXT);
        }
    },
    getElapsed: () => {
        if (!ProfilerGL.ext) return 0;
        const available = ProfilerGL.ext.getQueryObjectEXT(ProfilerGL.query, ProfilerGL.ext.QUERY_RESULT_AVAILABLE_EXT);
        const disjoint = ProfilerGL.gl.getParameter(ProfilerGL.ext.GPU_DISJOINT_EXT);
        if (available && !disjoint) {
            const timeElapsed = ProfilerGL.ext.getQueryObjectEXT(ProfilerGL.query, ProfilerGL.ext.QUERY_RESULT_EXT);
            ProfilerGL.lastQueryResult = (timeElapsed / 1000000);
            ProfilerGL.queryDone = true;
        }
        return ProfilerGL.lastQueryResult;
    }
};

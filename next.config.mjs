/** @type {import('next').NextConfig} */
export default {
    compiler: {
        emotion: true,
        styledComponents: true
    },
    experimental: { appDir: true },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/u,
            use: ["@svgr/webpack"]
        });
        return config;
    }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
    // SQLite uses native modules — keep it server-side only
    experimental: {},
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't bundle better-sqlite3 on the client side
            config.resolve.fallback = {
                ...config.resolve.fallback,
                'better-sqlite3': false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;

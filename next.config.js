/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "db.api.qual.su",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.yandexcloud.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "qualcloud.storage.yandexcloud.net",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const betaHosts = [
      "dev\\.notter\\.su",
      "localhost:3001",
    ];

    const betaRewrites = betaHosts.flatMap((host) => [
      {
        source: "/image/icon.png",
        has: [{ type: "header", key: "host", value: host }],
        destination: "/image/icon-beta.png",
      },
      {
        source: "/image/icon-dark.png",
        has: [{ type: "header", key: "host", value: host }],
        destination: "/image/icon-beta.png",
      },
      {
        source: "/image/logo.png",
        has: [{ type: "header", key: "host", value: host }],
        destination: "/image/beta-logo.png",
      },
      {
        source: "/image/logo-dark.png",
        has: [{ type: "header", key: "host", value: host }],
        destination: "/image/beta-logo.png",
      },
      {
        source: "/image/pwa-192.png",
        has: [{ type: "header", key: "host", value: host }],
        destination: "/image/icon-beta.png",
      },
      {
        source: "/image/pwa-512.png",
        has: [{ type: "header", key: "host", value: host }],
        destination: "/image/icon-beta.png",
      },
      {
        source: "/favicon.ico",
        has: [{ type: "header", key: "host", value: host }],
        destination: "/image/icon-beta.png",
      },
    ]);

    return [
      ...betaRewrites,
      {
        source: "/favicon.ico",
        destination: "/image/icon-dark.png",
      },
    ];
  },
};

module.exports = nextConfig;

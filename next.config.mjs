/** @type {import('next').NextConfig} */
const nextConfig = {
    // 允许myqcloud.com域名下的图片资源
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: '**.myqcloud.com',
            port: '',
            pathname: '/**',
          },
          {
            protocol: 'https',
            hostname: '**.hypermax.app',
            port: '',
            pathname: '/**',
          },
          {
            protocol: "http",
            hostname: "**.maxng.cc",
            port: "3889",
            pathname: "/**",
          },
          {
            protocol: "https",
            hostname: "**.qlogo.cn",
            port: "",
            pathname: "/**",
          }
        ],
      },
};

export default nextConfig;

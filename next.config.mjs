/** @type {import('next').NextConfig} */
const nextConfig = {
    // 允许myqcloud.com域名下的图片资源
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: '*ap-shanghai.myqcloud.com',
            port: '',
            pathname: '/**',
          },
          {
            protocol: 'https',
            hostname: '*hypermax.app',
            port: '',
            pathname: '/**',
          },
          {
            protocol: "http",
            hostname: "*maxng.cc",
            port: "3889",
            pathname: "/**",
          }
        ],
      },
};

export default nextConfig;

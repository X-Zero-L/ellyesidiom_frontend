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
        ],
      },
};

export default nextConfig;

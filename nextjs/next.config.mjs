/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  transpilePackages: ['swagger-ui-react', 'swagger-client', 'react-syntax-highlighter'],
};

export default nextConfig;

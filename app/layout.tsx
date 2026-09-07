import type { Metadata } from 'next';
import './globals.css';
import './v3.css';

export const metadata: Metadata = {
  title: '月嫂 AI 业务助手',
  description: '面向月嫂公司与母婴服务机构的客户业务工作台 Demo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: '岡山市 ごみ収集 今日・明日チェッカー｜地区・町名で簡単確認',
  description:
    '岡山市の地区・町名を選ぶだけで、今日・明日のごみ収集区分をすぐ確認。可燃/不燃/資源/プラなど分別に対応。スマホ対応の収集日チェッカー。'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta
          name="google-site-verification"
          content="zU7i1fr8Z1KOO_GPImK5csP6TtthL4tBQzlqoSBPX18"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-9QKZF8PNK0" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-9QKZF8PNK0');
        `}
      </Script>
    </html>
  );
}

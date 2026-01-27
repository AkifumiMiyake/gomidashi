import PickupChecker from '../components/pickup-checker';

export default function Page() {
  return (
    <main>
      <div className="container">
        <header>
          <h1>
            岡山市 ごみ収集<span className="title-break"><br /></span>今日・明日チェッカー
          </h1>
          <p className="summary-badge">
            地区と町名を選ぶと、今日・明日の収集内容をすぐ確認できます。
          </p>
        </header>
        <PickupChecker />
        <section className="seo-section">
          <h2>岡山市のごみ収集を今日・明日で確認</h2>
          <p>
            岡山市の地区と町名を選ぶだけで、今日と明日のごみ収集区分をすぐに確認できます。
            可燃ごみ・不燃ごみ・資源化物・プラスチック資源など、分別の確認に役立つシンプルな
            チェッカーです。
          </p>
          <p>
            収集日を朝や夜の短時間で確認できるよう最小構成のUIにしており、スマホでも快適に
            使えます。地区ごとのルールも一覧で見られるため、引っ越し直後の確認にも便利です。
          </p>
          <div className="seo-faq">
            <h3>Q. 今日・明日の収集区分はどこで決まる？</h3>
            <p>
              岡山市の地区・町名ごとの収集ルールに基づいて判定しています。地区を選んだあと、
              町名を選択すると今日・明日の区分が表示されます。
            </p>
            <h3>Q. ひらがな入力でもエリア検索できますか？</h3>
            <p>
              ひらがな入力にも対応しており、エリア名の読み（カタカナ）で候補がヒットします。
            </p>
            <h3>Q. 分別ルールの確認はできますか？</h3>
            <p>
              可燃ごみ・不燃ごみ・資源化物・プラスチック資源などのルールを、地区ごとの一覧で
              確認できます。
            </p>
          </div>
          <p className="seo-source">
            データ参照元：岡山市のごみ収集情報（KViewer由来データを取り込み）
            <br />
            本ページの表示は参考情報です。最新情報は岡山市の公式案内もご確認ください。
          </p>
        </section>
        <footer className="page-footer">
          <a
            href="https://x.com/TOjuNSceSy87633"
            target="_blank"
            rel="noopener noreferrer"
            className="x-link"
            aria-label="Xで作者を見る"
          >
            <img src="/x-logo.svg" alt="X" width="20" height="20" />
          </a>
          <a
            href="https://x.com/TOjuNSceSy87633"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            不具合・ご要望はこちら
          </a>
        </footer>
      </div>
    </main>
  );
}

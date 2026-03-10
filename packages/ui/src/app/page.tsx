export default function Home() {
  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold mb-4">キャラクター管理</h2>
        <p className="text-ae-text-secondary mb-4">
          登録されたキャラクターの一覧と管理を行います。
        </p>
        <button className="btn-primary">キャラクター一覧へ</button>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">新規キャラクター登録</h2>
        <p className="text-ae-text-secondary mb-4">
          After Effectsからレイヤー構造をキャプチャして新しいキャラクターを登録します。
        </p>
        <button className="btn-secondary">新規登録</button>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">アニメーション生成</h2>
        <p className="text-ae-text-secondary mb-4">
          AIを使用してキャラクターのアニメーションを自動生成します。
        </p>
        <button className="btn-secondary">生成開始</button>
      </section>
    </div>
  );
}

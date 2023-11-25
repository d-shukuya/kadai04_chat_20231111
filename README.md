# kadai04_chat_20231111
「04_Firebase」の課題用リポジトリ

# 『 WhiteboardChat 』

## DEMO
- https://gsdev26us07-68500.web.app

## 紹介と使い方
１つのホワイトボードをリアルタイムに共同編集できるアプリです。
#### ＜機能＞
1. ホワイトボード
   - 任意にボードを作成し、ホワイトボードのように文字や絵がかける
2. スタンプ
   - スタンプを選択し、「挿入」ボタンを押下して挿入モードにすると、クリックすることで canvas 上の任意の箇所にスタンプを挿入することができる
   - 挿入モード中に、クリックしたままマウスを動かすとそのままスタンプで線を描ける
   - 挿入モードの解除は、「解除」ボタンを押下するか、キーボードの「esc」ボタンを押下する
3. 編集内容を共有
   - 下書き中のもの、投稿したものをリアルタイムに共同編集中の他のユーザーに表示
4. 共同編集者を表示
   - 今、誰が作業を行っているか画面上に表示
5. チャット
   - どの部分を誰がいつ記載したかチャットのように残せる

## 工夫した点
- 描画の様子をリアルタイムに他のユーザにも見えるようにしたこと
- 同時更新によるコンフリクトが出来るだけ起きないようにしたこと

## 苦戦した点
- 共同編集者のマウスカーソルの位置を表示する機能を本当は全画面でやりたかったが、マウスイベントを使う他のすべてのイベント（ボタンなど）と両立するには複雑になりそうだったため、今回はホワイトボード上だけ実現した。

## 参考にした web サイトなど
- 色々

## 作業時間
- 25
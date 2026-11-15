HorseDays — 旧スマホ専用3Dレース観戦画面 復旧パッチ (2026-11-15)

【概要】
今のUnity WebGLゲームを維持し、通常のレース観戦時だけ、以前の phone-web の専用観戦画面を重ねて表示します。
今回送ってもらった race.html、race3d.js、broadcast-camera.js、race-speech.js などを利用します。
Unity の RaceViewInk.cs と BrowserSave.jslib に既にある連携を使用するため、対応する v18 ビルドなら Unity の再ビルドは不要です。

【GitHubへの反映方法】
1. 現在の GitHub リポジトリ Horsedays_Web のフォルダをバックアップしてください。
2. この ZIP を解凍し、README.txt 以外の中身を GitHub Desktop の Repository > Show in Explorer で開くフォルダにコピーしてください。
   index.html がリポジトリ直下に来るようにします。Build/ フォルダは既存のものを残します。
3. GitHub Desktop で Commit to main → Push origin を行います。
4. 公開URL https://kom322.github.io/Horsedays_Web/ を再読み込みして観戦レースを試してください。
5. カメラが戻らない、描画が止まる場合は、ブラウザのコンソールと画面のスクリーンショットを記録してください。

【重要な制約】
- 元の phone-web にあった horse/jockey の高品質メッシュ (classic/*.bin、new-horse/*.bin) と実テクスチャは今回の添付には含まれていません。
  代わりに元の JavaScript 内の簡易3D馬モデルから生成した代替メッシュを同梱しています。
  したがって以前と完全に同じ馬体の3D画質にはなりません。
- Unity に加え iframe 側でも WebGL を動かすため、スマホによっては動作が重くなる可能性があります。
- Unity 実機・公開サイトでの総合テストは未実施です。JavaScript構文、必要ファイル、連携の模擬テストを実施します。
- index.html に牧場名入力の修正とセーブ圧縮の修正が含まれています。既存の保存データは削除しません。
- 将来 Unity で再ビルドしたら index.html が上書きされるため、再度このパッチの index.html および関連ファイルを反映してください。

【元の高品質3Dモデルを戻す場合】
元の phone-web/public/model-lab フォルダの new-horse/ と classic/ のうち、
 horse-fixed.bin / horse-low-fixed.bin / horse.jpg、jockey.bin / jockey-low.bin / jockey.png だけを送ってください。
（ZIP全体を送る必要はありません。）
モデルを元に戻す時は model-lab/race.html 中の HorseDaysBundledFallbackModels=true を false に変更します。

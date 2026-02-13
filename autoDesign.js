// ai-add-equipment.js
// Minimal plugin: prompt + (x,y,w,h) -> insert a dummy equipment shape.

Draw.loadPlugin(function (ui) {
  // 1) Action登録
  ui.actions.addAction('aiAddEquipment', function () {
    const graph = ui.editor.graph;

    // 初期値：選択範囲があればその左上あたりに置く
    const cells = graph.getSelectionCells();
    let x = 100, y = 100, w = 120, h = 60;

    try {
      if (cells && cells.length > 0) {
        const bounds = graph.getBoundingBoxFromGeometry(cells);
        if (bounds) {
          x = Math.round(bounds.x);
          y = Math.round(bounds.y);
        }
      }
    } catch (e) {
      // bounds取得失敗時はデフォルトのまま
    }

    // 2) 入力ダイアログ（プロンプト + 座標/サイズ）
    const container = document.createElement('div');
    container.style.padding = '8px';
    container.style.maxWidth = '420px';

    container.innerHTML = `
      <div style="margin-bottom:8px;">
        <div style="font-weight:600; margin-bottom:4px;">プロンプト</div>
        <textarea id="aiPrompt" rows="3" style="width:100%; box-sizing:border-box;"
          placeholder="例：この範囲に分岐用のMCCBを追加して"></textarea>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
        <div>
          <div style="font-weight:600; margin-bottom:4px;">x</div>
          <input id="posX" type="number" style="width:100%; box-sizing:border-box;" value="${x}">
        </div>
        <div>
          <div style="font-weight:600; margin-bottom:4px;">y</div>
          <input id="posY" type="number" style="width:100%; box-sizing:border-box;" value="${y}">
        </div>
        <div>
          <div style="font-weight:600; margin-bottom:4px;">w</div>
          <input id="sizeW" type="number" style="width:100%; box-sizing:border-box;" value="${w}">
        </div>
        <div>
          <div style="font-weight:600; margin-bottom:4px;">h</div>
          <input id="sizeH" type="number" style="width:100%; box-sizing:border-box;" value="${h}">
        </div>
      </div>

      <div style="font-size:12px; opacity:0.8;">
        ※いまはAI呼び出しなしで「ダミー設備」を追加します（次でAPI連携に置き換え可能）
      </div>
    `;

    const okFn = () => {
      const prompt = (container.querySelector('#aiPrompt').value || '').trim();
      const px = Number(container.querySelector('#posX').value);
      const py = Number(container.querySelector('#posY').value);
      const pw = Number(container.querySelector('#sizeW').value);
      const ph = Number(container.querySelector('#sizeH').value);

      if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pw) || !Number.isFinite(ph)) {
        ui.alert('x, y, w, h は数値で入力してください。');
        return;
      }

      // 3) 図へ追加（トランザクション）
      const model = graph.getModel();
      model.beginUpdate();
      try {
        const parent = graph.getDefaultParent();

        // ダミー設備のスタイル（お好みで変更OK）
        // ここでは「角丸の箱 + うっすら影 + 中央揃え」くらい
        const style =
          'rounded=1;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;' +
          'shadow=0;strokeWidth=2;';

        const label = prompt ? `AI設備\n${prompt}` : 'AI設備';

        const v1 = graph.insertVertex(parent, null, label, px, py, pw, ph, style);

        // “設備っぽさ”として小さな端子を左右に追加（任意）
        const termStyle = 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=2;';
        const tL = graph.insertVertex(parent, null, '', px - 10, py + ph / 2 - 5, 10, 10, termStyle);
        const tR = graph.insertVertex(parent, null, '', px + pw, py + ph / 2 - 5, 10, 10, termStyle);

        // 端子と設備を線でつなぐ（任意）
        const edgeStyle = 'endArrow=none;html=1;strokeWidth=2;';
        graph.insertEdge(parent, null, '', tL, v1, edgeStyle);
        graph.insertEdge(parent, null, '', v1, tR, edgeStyle);

        // 追加した設備を選択状態に
        graph.setSelectionCell(v1);
      } finally {
        model.endUpdate();
      }
    };

    // draw.ioの標準ダイアログ表示
    ui.showDialog(
      container,
      460,
      340,
      true,  // modal
      true,  // closable
      okFn
    );
  });

  // 4) メニューに追加（例：Extras 配下）
  // ※環境によってメニューの名称/構成が多少違いますが、この形が一番簡単です
  ui.menubar.addMenu('AI', function (menu, parent) {
    ui.menus.addMenuItem(menu, 'aiAddEquipment');
  });

  // 5) ラベル表示名（メニュー表示）
  // addAction だけだと表示が内部名になる場合があるので、labelもセット
  if (ui.actions.get('aiAddEquipment')) {
    ui.actions.get('aiAddEquipment').label = 'AI: 設備を追加（最小サンプル）';
  }
});

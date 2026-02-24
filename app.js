// ===== 用紙サイズ定義 (mm) =====
const PAGE_SIZES = {
    a3: { width: 297, height: 420, label: 'A3' },
    a4: { width: 210, height: 297, label: 'A4' },
    a5: { width: 148, height: 210, label: 'A5' },
    a6: { width: 105, height: 148, label: 'A6' },
    b4: { width: 250, height: 353, label: 'B4' },
    b5: { width: 176, height: 250, label: 'B5' },
    b6: { width: 128, height: 182, label: 'B6' },
    hagaki: { width: 100, height: 148, label: 'ハガキ' },
    letter: { width: 215.9, height: 279.4, label: 'Letter' },
};

// ===== DOM要素 =====
const els = {
    pageSize: document.getElementById('pageSize'),
    orientation: document.getElementById('orientation'),
    lineType: document.getElementById('lineType'),
    lineSpacing: document.getElementById('lineSpacing'),
    lineSpacingValue: document.getElementById('lineSpacingValue'),
    lineColor: document.getElementById('lineColor'),
    lineWidth: document.getElementById('lineWidth'),
    lineWidthValue: document.getElementById('lineWidthValue'),
    marginTop: document.getElementById('marginTop'),
    marginTopValue: document.getElementById('marginTopValue'),
    marginBottom: document.getElementById('marginBottom'),
    marginBottomValue: document.getElementById('marginBottomValue'),
    marginLeft: document.getElementById('marginLeft'),
    marginLeftValue: document.getElementById('marginLeftValue'),
    marginRight: document.getElementById('marginRight'),
    marginRightValue: document.getElementById('marginRightValue'),
    pageCount: document.getElementById('pageCount'),
    previewCanvas: document.getElementById('previewCanvas'),
    previewInfo: document.getElementById('previewInfo'),
    generateBtn: document.getElementById('generateBtn'),
    openBtn: document.getElementById('openBtn'),
};

// ===== 設定を取得 =====
function getSettings() {
    const sizeKey = els.pageSize.value;
    const size = PAGE_SIZES[sizeKey];
    const isLandscape = els.orientation.value === 'landscape';

    return {
        pageWidth: isLandscape ? size.height : size.width,
        pageHeight: isLandscape ? size.width : size.height,
        sizeKey,
        sizeLabel: size.label,
        orientation: els.orientation.value,
        lineType: els.lineType.value,
        lineSpacing: parseFloat(els.lineSpacing.value),
        lineColor: els.lineColor.value,
        lineWidth: parseFloat(els.lineWidth.value),
        marginTop: parseFloat(els.marginTop.value),
        marginBottom: parseFloat(els.marginBottom.value),
        marginLeft: parseFloat(els.marginLeft.value),
        marginRight: parseFloat(els.marginRight.value),
        pageCount: parseInt(els.pageCount.value) || 1,
    };
}

// ===== 行数・列数計算 =====
function calcCounts(settings) {
    const drawableWidth = settings.pageWidth - settings.marginLeft - settings.marginRight;
    const drawableHeight = settings.pageHeight - settings.marginTop - settings.marginBottom;
    return {
        rows: Math.floor(drawableHeight / settings.lineSpacing),
        cols: Math.floor(drawableWidth / settings.lineSpacing)
    };
}

// ===== プレビュー描画 =====
function drawPreview() {
    const s = getSettings();
    const canvas = els.previewCanvas;
    const ctx = canvas.getContext('2d');

    const scale = 2;
    const displayWidth = 360;
    const ratio = s.pageHeight / s.pageWidth;
    const displayHeight = displayWidth * ratio;

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    ctx.scale(scale, scale);

    const pxPerMm = displayWidth / s.pageWidth;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const mLeft = s.marginLeft * pxPerMm;
    const mRight = s.marginRight * pxPerMm;
    const mTop = s.marginTop * pxPerMm;
    const mBottom = s.marginBottom * pxPerMm;

    ctx.fillStyle = 'rgba(230, 240, 255, 0.3)';
    ctx.fillRect(0, 0, displayWidth, mTop);
    ctx.fillRect(0, displayHeight - mBottom, displayWidth, mBottom);
    ctx.fillRect(0, mTop, mLeft, displayHeight - mTop - mBottom);
    ctx.fillRect(displayWidth - mRight, mTop, mRight, displayHeight - mTop - mBottom);

    const counts = calcCounts(s);
    const spacingPx = s.lineSpacing * pxPerMm;
    const lineWidthPx = Math.max(0.5, s.lineWidth * pxPerMm * 0.8);

    ctx.strokeStyle = s.lineColor;
    ctx.fillStyle = s.lineColor;
    ctx.lineWidth = lineWidthPx;

    const drawW = displayWidth - mLeft - mRight;
    const drawH = displayHeight - mTop - mBottom;

    if (s.lineType === 'ruled' || s.lineType === 'ruled-dot' || s.lineType === 'dashed') {
        for (let i = 1; i <= counts.rows; i++) {
            const y = mTop + i * spacingPx;
            ctx.beginPath();
            if (s.lineType === 'dashed') {
                ctx.setLineDash([2, 2]);
            } else {
                ctx.setLineDash([]);
            }
            ctx.moveTo(mLeft, y);
            ctx.lineTo(displayWidth - mRight, y);
            ctx.stroke();
            ctx.setLineDash([]);

            if (s.lineType === 'ruled-dot') {
                const dotRadius = lineWidthPx * 1.2;
                for (let j = 0; j <= counts.cols; j++) {
                    const x = mLeft + j * spacingPx;
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    } else if (s.lineType === 'graph') {
        // 横線
        for (let i = 0; i <= counts.rows; i++) {
            const y = mTop + i * spacingPx;
            ctx.beginPath();
            ctx.moveTo(mLeft, y);
            ctx.lineTo(mLeft + counts.cols * spacingPx, y);
            ctx.stroke();
        }
        // 縦線
        for (let j = 0; j <= counts.cols; j++) {
            const x = mLeft + j * spacingPx;
            ctx.beginPath();
            ctx.moveTo(x, mTop);
            ctx.lineTo(x, mTop + counts.rows * spacingPx);
            ctx.stroke();
        }
    } else if (s.lineType === 'dot') {
        const dotRadius = lineWidthPx * 0.8;
        for (let i = 0; i <= counts.rows; i++) {
            const y = mTop + i * spacingPx;
            for (let j = 0; j <= counts.cols; j++) {
                const x = mLeft + j * spacingPx;
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    const info = els.previewInfo;
    info.innerHTML = `
        <div class="info-item">
            <span class="info-label">用紙</span>
            <span class="info-value">${s.sizeLabel} ${s.orientation === 'landscape' ? '横' : '縦'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">間隔</span>
            <span class="info-value">${s.lineSpacing}mm</span>
        </div>
        <div class="info-item">
            <span class="info-label">種類</span>
            <span class="info-value">${s.lineType === 'ruled' ? '横罫線' : s.lineType === 'ruled-dot' ? '横罫線 (ドット入り)' : s.lineType === 'dashed' ? '横罫線 (点線)' : s.lineType === 'dot' ? 'ドット' : '方眼'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">ページ数</span>
            <span class="info-value">${s.pageCount}ページ</span>
        </div>
    `;
}

// ===== HEX → RGB変換 =====
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

// ===== PDFドキュメント作成共通処理 =====
function createPDFDoc() {
    const s = getSettings();
    const { jsPDF } = window.jspdf;

    const baseSize = PAGE_SIZES[s.sizeKey];
    const doc = new jsPDF({
        orientation: s.orientation === 'landscape' ? 'l' : 'p',
        unit: 'mm',
        format: [baseSize.width, baseSize.height]
    });

    const rgb = hexToRgb(s.lineColor);
    const counts = calcCounts(s);

    for (let page = 0; page < s.pageCount; page++) {
        if (page > 0) doc.addPage();
        doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.setLineWidth(s.lineWidth * 0.3528); // pt -> mm

        if (s.lineType === 'ruled' || s.lineType === 'ruled-dot' || s.lineType === 'dashed') {
            for (let i = 1; i <= counts.rows; i++) {
                const y = s.marginTop + i * s.lineSpacing;
                if (s.lineType === 'dashed') {
                    doc.setLineDashPattern([1, 1], 0);
                } else {
                    doc.setLineDashPattern([], 0);
                }
                doc.line(s.marginLeft, y, s.pageWidth - s.marginRight, y);
                doc.setLineDashPattern([], 0);

                if (s.lineType === 'ruled-dot') {
                    const dotR = s.lineWidth * 0.2; // mmでの半径目安
                    for (let j = 0; j <= counts.cols; j++) {
                        const x = s.marginLeft + j * s.lineSpacing;
                        doc.circle(x, y, dotR, 'F');
                    }
                }
            }
        } else if (s.lineType === 'graph') {
            for (let i = 0; i <= counts.rows; i++) {
                const y = s.marginTop + i * s.lineSpacing;
                doc.line(s.marginLeft, y, s.marginLeft + counts.cols * s.lineSpacing, y);
            }
            for (let j = 0; j <= counts.cols; j++) {
                const x = s.marginLeft + j * s.lineSpacing;
                doc.line(x, s.marginTop, x, s.marginTop + counts.rows * s.lineSpacing);
            }
        } else if (s.lineType === 'dot') {
            const dotR = s.lineWidth * 0.15; // mmでの半径目安
            for (let i = 0; i <= counts.rows; i++) {
                const y = s.marginTop + i * s.lineSpacing;
                for (let j = 0; j <= counts.cols; j++) {
                    const x = s.marginLeft + j * s.lineSpacing;
                    doc.circle(x, y, dotR, 'F');
                }
            }
        }
    }
    return doc;
}

// ===== ダウンロード実行 =====
function downloadPDF() {
    const doc = createPDFDoc();
    const s = getSettings();
    const filename = `ruled_note_${s.sizeKey}.pdf`;

    try {
        doc.save(filename);
    } catch (e) {
        console.error("Save failed, trying manual download:", e);
        const dataUri = doc.output('datauristring');
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===== プレビュー（別タブ）で表示 =====
function openPDFInNewTab() {
    const doc = createPDFDoc();
    try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (e) {
        console.error("Open failed:", e);
        doc.output('dataurlnewwindow');
    }
}

// ===== カラーボタン設定 =====
function setupColorButtons() {
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            els.lineColor.value = btn.dataset.color;
            drawPreview();
        });
    });
    els.lineColor.addEventListener('input', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        drawPreview();
    });
}

// ===== プリセット設定 =====
function applyPreset(preset) {
    switch (preset) {
        case 'college':
            els.lineType.value = 'ruled';
            els.lineSpacing.value = 7;
            els.marginTop.value = 21;
            els.marginBottom.value = 10;
            els.marginLeft.value = 0;
            els.marginRight.value = 0;
            break;
        case 'wide':
            els.lineType.value = 'ruled';
            els.lineSpacing.value = 10;
            els.marginTop.value = 21;
            els.marginBottom.value = 10;
            els.marginLeft.value = 0;
            els.marginRight.value = 0;
            break;
        case 'narrow':
            els.lineType.value = 'ruled';
            els.lineSpacing.value = 5;
            els.marginTop.value = 21;
            els.marginBottom.value = 10;
            els.marginLeft.value = 0;
            els.marginRight.value = 0;
            break;
        case 'elementary':
            els.lineType.value = 'ruled';
            els.lineSpacing.value = 12;
            els.marginTop.value = 21;
            els.marginBottom.value = 10;
            els.marginLeft.value = 0;
            els.marginRight.value = 0;
            break;
        case 'dotruled':
            els.lineType.value = 'ruled-dot';
            els.lineSpacing.value = 7;
            els.marginTop.value = 21;
            els.marginBottom.value = 10;
            els.marginLeft.value = 0;
            els.marginRight.value = 0;
            break;
    }
    updateAllDisplayValues();
    drawPreview();
}

function setupPresets() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });
}

// ===== 表示値更新 =====
function updateAllDisplayValues() {
    els.lineSpacingValue.textContent = els.lineSpacing.value + 'mm';
    els.lineWidthValue.textContent = els.lineWidth.value + 'pt';
    els.marginTopValue.textContent = els.marginTop.value + 'mm';
    els.marginBottomValue.textContent = els.marginBottom.value + 'mm';
    els.marginLeftValue.textContent = els.marginLeft.value + 'mm';
    els.marginRightValue.textContent = els.marginRight.value + 'mm';
}

// ===== イベントリスナー設定 =====
function setupEventListeners() {
    els.pageSize.addEventListener('change', drawPreview);
    els.orientation.addEventListener('change', drawPreview);
    els.lineType.addEventListener('change', drawPreview);

    [els.lineSpacing, els.lineWidth, els.marginTop, els.marginBottom, els.marginLeft, els.marginRight].forEach(el => {
        el.addEventListener('input', () => {
            updateAllDisplayValues();
            drawPreview();
        });
    });

    els.pageCount.addEventListener('change', drawPreview);
    els.generateBtn.addEventListener('click', downloadPDF);
    if (els.openBtn) els.openBtn.addEventListener('click', openPDFInNewTab);
}

function init() {
    updateAllDisplayValues();
    setupColorButtons();
    setupPresets();
    setupEventListeners();
    drawPreview();
}

document.addEventListener('DOMContentLoaded', init);

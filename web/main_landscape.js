// A-Frameのシーンが完全に読み込まれてから処理を開始する

document.querySelector('a-scene').addEventListener('loaded', () => {

    // ==========================================
    // 設定・定数
    // ==========================================
    const ANIMATION_DURATION = 1000;
    const DISPLAY_TIME = 20000;
    const BASE_ASPECT_RATIO = 16 / 9;

    // 【▼▼▼ 調整点①：大きさ ▼▼▼】
    // 縦画面での縮小補正の強さ。数値を小さくするほど、縦画面でモデルが大きく表示されます。
    // (例: 0.5 -> 0.3 に変更)
    const CORRECTION_STRENGTH = 0.15;

    // 【▼▼▼ 調整点②：中心位置 ▼▼▼】
    // 'demo2'以外のモデルを左にずらす量。数値を大きくするほど、より左に移動します。
    const HORIZONTAL_SHIFT_AMOUNT = 0.65;
    // 【▲▲▲ ▲▲▲ ▲▲▲】

    const markerModelPairs = [
        { marker: 'marker-demo2', model: 'fixed-demo2' },
        { marker: 'marker-innovative', model: 'fixed-innovative' },
        { marker: 'marker-innovative_2', model: 'fixed-innovative_2' },
        { marker: 'marker-ai', model: 'fixed-ai' },
        { marker: 'marker-co_creation', model: 'fixed-co_creation' },
        { marker: 'marker-first', model: 'fixed-first' },
        { marker: 'marker-second', model: 'fixed-second' }
    ];

    // ==========================================
    // 要素の取得と状態管理
    // ==========================================
    const buttonContainer = document.querySelector('#button-container');
    const hideButton = document.querySelector('#hide-button');
    const allModelElements = [];

    let currentActiveModel = null;
    let displayTimer = null;
    let isAnimating = false;

    // ==========================================
    // 初期化処理
    // ==========================================
    markerModelPairs.forEach(pair => {
        const markerEl = document.querySelector(`#${pair.marker}`);
        const modelEl = document.querySelector(`#${pair.model}`);
        if (!markerEl || !modelEl) return;

        const originalScale = modelEl.getAttribute('scale');
        const originalPosition = modelEl.getAttribute('position');
        modelEl.dataset.originalScale = AFRAME.utils.coordinates.stringify(originalScale);
        modelEl.dataset.originalPosition = AFRAME.utils.coordinates.stringify(originalPosition);

        allModelElements.push(modelEl);
        resetModelAppearance(modelEl);

        markerEl.addEventListener('markerFound', () => handleMarkerFound(modelEl));
    });

    buttonContainer.style.display = 'none';

    // ==========================================
    // 関数定義
    // ==========================================

    /**
     * 【変更】画面のアスペクト比に応じてモデルの位置を調整する関数
     */
    function adjustModelsForAspectRatio() {
        const currentAspect = window.innerWidth / window.innerHeight;

        allModelElements.forEach(modelEl => {
            const originalPos = AFRAME.utils.coordinates.parse(modelEl.dataset.originalPosition);

            // 最終的な位置を格納する変数
            let finalX = originalPos.x;
            let finalZ = originalPos.z;

            // --- 調整ロジック ---

            // 1. 水平位置(X)の調整: demo2以外なら左にずらす
            if (modelEl.id !== 'fixed-demo2') {
                finalX -= HORIZONTAL_SHIFT_AMOUNT;
            }

            // 2. 奥行き(Z)の調整: 基準より縦長なら奥に配置する
            if (currentAspect < BASE_ASPECT_RATIO) {
                const idealRatio = BASE_ASPECT_RATIO / currentAspect;
                const moderatedRatio = 1 + (idealRatio - 1) * CORRECTION_STRENGTH;
                finalZ = originalPos.z * moderatedRatio;
            }

            // 3. 計算した最終的な位置をモデルに適用
            modelEl.setAttribute('position', { x: finalX, y: originalPos.y, z: finalZ });
        });
    }


    function resetModelAppearance(model) {
        model.setAttribute('visible', 'false');
        model.setAttribute('scale', '0 0 0');
        model.setAttribute('rotation', '0 0 0');
        model.removeAttribute('animation__show_scale');
        model.removeAttribute('animation__show_rot');
        model.removeAttribute('animation__hide_scale');
        model.removeAttribute('animation__hide_rot');
    }

    function clearTimerAndUI() {
        if (displayTimer) clearTimeout(displayTimer);
        displayTimer = null;
        buttonContainer.style.display = 'none';
    }

    function runHideSequence(model, onComplete) {
        if (!model) { if (onComplete) onComplete(); return; }
        isAnimating = true;
        clearTimerAndUI();
        model.removeAttribute('animation__show_scale');
        model.removeAttribute('animation__show_rot');
        const fromScale = model.dataset.originalScale;
        model.setAttribute('animation__hide_scale', { property: 'scale', from: fromScale, to: '0 0 0', dur: ANIMATION_DURATION, easing: 'easeInQuad' });
        model.setAttribute('animation__hide_rot', { property: 'rotation', from: '0 0 0', to: '0 -360 0', dur: ANIMATION_DURATION, easing: 'easeInOutQuad' });
        const onHideComplete = () => {
            resetModelAppearance(model);
            if (currentActiveModel === model) currentActiveModel = null;
            isAnimating = false;
            if (onComplete) onComplete();
        };
        model.addEventListener('animationcomplete__hide_scale', onHideComplete, { once: true });
    }

    function runShowSequence(model) {
        isAnimating = true;
        currentActiveModel = model;
        resetModelAppearance(model);
        model.setAttribute('visible', 'true');
        const targetScale = model.dataset.originalScale;
        model.setAttribute('animation__show_scale', { property: 'scale', from: '0 0 0', to: targetScale, dur: ANIMATION_DURATION, easing: 'easeOutBack' });
        model.setAttribute('animation__show_rot', { property: 'rotation', from: '0 0 0', to: '0 360 0', dur: ANIMATION_DURATION, easing: 'easeOutQuad' });
        const onShowComplete = () => {
            model.removeAttribute('animation__show_scale');
            model.removeAttribute('animation__show_rot');
            model.setAttribute('rotation', '0 0 0');
            model.setAttribute('scale', targetScale);
            isAnimating = false;
            buttonContainer.style.display = 'block';
            displayTimer = setTimeout(() => {
                if (currentActiveModel === model && !isAnimating) runHideSequence(model);
            }, DISPLAY_TIME);
        };
        model.addEventListener('animationcomplete__show_scale', onShowComplete, { once: true });
    }

    function handleMarkerFound(foundModel) {
        if (currentActiveModel === foundModel || isAnimating) return;
        if (currentActiveModel) {
            runHideSequence(currentActiveModel, () => runShowSequence(foundModel));
        } else {
            runShowSequence(foundModel);
        }
    }

    // ==========================================
    // イベントリスナー設定
    // ==========================================
    hideButton.addEventListener('click', () => {
        if (currentActiveModel && !isAnimating) runHideSequence(currentActiveModel);
    });
    window.addEventListener('resize', adjustModelsForAspectRatio);

    // ==========================================
    // 初期実行
    // ==========================================
    adjustModelsForAspectRatio();
});

// ▼▼▼ 【追加】使い方ガイド制御用スクリプト ▼▼▼
document.addEventListener('DOMContentLoaded', () => {
    const guideOverlay = document.getElementById('guide-overlay');
    const slides = document.querySelectorAll('.guide-slide');
    const prevBtn = document.getElementById('guide-prev-btn');
    const nextBtn = document.getElementById('guide-next-btn');
    const startBtn = document.getElementById('guide-start-btn');

    // 要素が見つからなければ終了
    if (!guideOverlay || slides.length === 0) return;

    let currentSlideIndex = 0;

    // スライドとボタンの状態を更新する関数
    function updateGuide() {
        // すべてのスライドを非表示
        slides.forEach((slide, index) => {
            if (index === currentSlideIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // ボタンの出し分け

        // 1ページ目：「戻る」を隠す（visibilityでレイアウト維持でも良いが、今回は右寄せレイアウトなのでdisplayでも可。画像に合わせて非表示に）
        if (currentSlideIndex === 0) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
        }

        // 最後のページ：「次へ」を隠して「スタート」を表示
        if (currentSlideIndex === slides.length - 1) {
            nextBtn.style.display = 'none';
            startBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            startBtn.style.display = 'none';
        }
    }

    // 初期表示更新
    updateGuide();

    // イベントリスナー設定

    // 次へボタン
    nextBtn.addEventListener('click', () => {
        if (currentSlideIndex < slides.length - 1) {
            currentSlideIndex++;
            updateGuide();
        }
    });

    // 戻るボタン
    prevBtn.addEventListener('click', () => {
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            updateGuide();
        }
    });

    // スタートボタン（ガイドを閉じる）
    startBtn.addEventListener('click', () => {
        // フェードアウト
        guideOverlay.style.transition = 'opacity 0.5s';
        guideOverlay.style.opacity = '0';

        setTimeout(() => {
            guideOverlay.style.display = 'none';
        }, 500);
    });
});
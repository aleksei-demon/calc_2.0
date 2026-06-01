// logic.js
let inputQueue = []; // Здесь храним порядок ввода: ['voltage', 'current']


function handleOnInput(id) {
    const el = document.getElementById(id);
    // 1. Если пользователь стер данные вручную - удаляем из очереди
    if (el.value === '') {
        inputQueue = inputQueue.filter(itemId => itemId !== id);
        toggle_input_cssClass(el, false); // Снимаем покраску
        return;
    }
    // 2. Если это поле уже было в очереди - удаляем старую запись, чтобы обновить её позицию
    inputQueue = inputQueue.filter(itemId => itemId !== id);
    // 3. Добавляем текущее поле в конец очереди (теперь оно самое "свежее")
    inputQueue.push(id);
    toggle_input_cssClass(el, false); // Красим как "Ввод пользователя"
    // 4. МАГИЯ: Если введено больше 2-х параметров
    if (inputQueue.length > 2) {
        const oldestId = inputQueue.shift(); // Выбиваем самый старый ID
        const oldestEl = document.getElementById(oldestId);
        if (oldestEl) {
            oldestEl.value = ''; // Затираем старый операнд
            toggle_input_cssClass(oldestEl, false); // Снимаем краску
        }
    }
    // 5. Если у нас есть ровно 2 операнда - считаем автоматически!
    if (inputQueue.length === 2) {
        runTwoFieldCalculation();
    }
}

function runTwoFieldCalculation() {
    // Собираем значения только из тех полей, что в очереди (user_fill)
    const vals = {};
    inputQueue.forEach(id => {
        vals[id] = parseFloat(document.getElementById(id).value);
    });
    // Математика (сокращенная версия для примера)
    // Здесь мы используем твою функцию расчета, которая вернет объект с результатами
    let results;
    if (document.body.classList.contains('body_ohms')) { results = calculateOhm(vals); }
    if (document.body.classList.contains('body_trans')) { results = calculateTrans(vals); }
    // Выводим результаты в пустые поля
    if (results) {
        Object.entries(results).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (!inputQueue.includes(id)) { // Не трогаем то, что ввел пользователь
                el.value = parseFloat(Number(val).toFixed(3));
                toggle_input_cssClass(el, true); // Красим как "Результат"
            }
        });
    }
}


function oneOpCalculation(id) {
    const el = document.getElementById(id);
    if (!el) return;

    // 1. ЧИСТКА ВВОДА
    const cleanedValue = comma_point_correct(el.value);
    if (el.value !== cleanedValue) { el.value = cleanedValue; }
    const val = parseFloat(el.value);

    // 2. СПЕЦИФИЧЕСКИЕ ЭКРАНЫ (График Болта и Калькулятор)
    if (id.includes('_test')) {
        const viewport = document.getElementById('bolt_viewport');
        if (viewport) viewport.innerHTML = generateBoltGraphSVG();

        // Валидация высоты для экрана Теста
        const hInput = document.getElementById('height_test');
        validateHeight(hInput);
        return;
    }

    // Возвращаем проверку обычного калькулятора
    if (document.body.classList.contains('body_calc')) {
        runCalculator();
        return;
    }

    // 3. ОБРАБОТКА ПУСТЫХ ПОЛЕЙ
    if (isNaN(val) || el.value === '') {
        const form = el.closest('form');
        if (form) {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
                toggle_input_cssClass(input, false);
                input.classList.remove('error_fill');
            });
        }
        return;
    }

    toggle_input_cssClass(el, false);

    // 4. РАСЧЕТЫ 
    let results = null;

    // К.Д.П.
    if (id.includes('KDP_')) { results = calculateKDP(id, val); }
    // Акустика (Speaker)
    if (document.body.classList.contains('body_spk')) { results = calculateSpeaker(id, val); }
    // Резонатор Гельмгольца
    if (id.includes('Helmholtz')) { calculateHelmholtz(id, val); }

    // 5. ВЫВОД РЕЗУЛЬТАТОВ В ИНПУТЫ
    if (results) {
        Object.entries(results).forEach(([resId, resVal]) => {
            const finalId = id.includes('KDP_') ? 'KDP_' + resId : resId;
            const input = document.getElementById(finalId);
            if (input && finalId !== id) {
                // Используем toFixed(2) для точности, но parseFloat уберет лишние нули
                input.value = parseFloat(Number(resVal).toFixed(1));
                toggle_input_cssClass(input, true);
            }
        });
    }

    // 6. ВАЛИДАЦИЯ ВЫСОТЫ (на любую ситуацию)
    // Ищем поле высоты именно в той форме, где сейчас работаем
    const currentForm = el.closest('form');
    if (currentForm) {
        const hInput = currentForm.querySelector('input[id*="height"]');
        if (hInput) validateHeight(hInput);
    }

    // 7. ОБНОВЛЕНИЕ ЧЕРТЕЖА КДП
    if (id.includes('KDP_')) {
        const rw = document.getElementById('KDP_width')?.value || 1.618;
        const rl = document.getElementById('KDP_length')?.value || 2.618;
        const roomView = document.getElementById('room_viewport');
        if (roomView) roomView.innerHTML = generateRoomSVG2D(rw, rl);
    }
}


/**
 * Универсальная функция валидации высоты
 */
function validateHeight(inputEl) {
    if (!inputEl) return;
    // 1. Сразу отменяем старый план "поругать" пользователя
    clearTimeout(inputEl.timeoutId);
    const h = parseFloat(inputEl.value);

    // Если число уже нормальное или поле пустое — убираем красноту сразу
    if (h >= 2.39 || isNaN(h) || h === 0) {
        inputEl.classList.remove('error_fill');
        return; // Дальше ничего делать не нужно, выходим
    }

    // Если всё еще мало, ставим таймер. 
    inputEl.timeoutId = setTimeout(() => {
        // Проверяем значение именно В МОМЕНТ срабатывания таймера
        const currentH = parseFloat(inputEl.value);
        if (currentH > 0 && currentH < 2.39) {
            inputEl.classList.add('error_fill');
        }
    }, 1000);
}


function calculateOhm(vals) {
    const { voltage: u, current: i, Resistance: r, power: p } = vals;
    // Ищем пару и возвращаем остальные два
    if (u && i) return { Resistance: u / i, power: u * i };
    if (u && r) return { current: u / r, power: (u ** 2) / r };
    if (i && r) return { voltage: i * r, power: (i ** 2) * r };
    if (p && u) return { current: p / u, Resistance: (u ** 2) / p };
    if (p && i) return { voltage: p / i, Resistance: p / (i ** 2) };
    if (p && r) return { voltage: Math.sqrt(p * r), current: Math.sqrt(p / r) };
    return null;
}

function calculateTrans(vals) {
    console.log('calculateTrans');
    const { ktr_: K, loadR_: LR, anodR_: AR, } = vals;
    // Ищем пару и возвращаем третий
    if (K && LR) return { anodR_: (LR * (K ** 2)).toFixed(1) };
    if (K && AR) return { loadR_: (AR / (K ** 2)).toFixed(1) };
    if (LR && AR) return { ktr_: (Math.sqrt(AR / LR)).toFixed(1) };
    return null;
}

function calculateSpeaker(id, val) {
    const z = 1.618;
    let tall, wide, depth, vol;
    if (id === 'tall') {
        tall = val;
        wide = tall / z;
        depth = wide / z;
    } else if (id === 'wide') {
        wide = val;
        tall = wide * z;
        depth = wide / z;
    } else if (id === 'depth') {
        depth = val;
        wide = depth * z;
        tall = wide * z;
    } else if (id === 'vol') {
        // Расчет сторон из объема (л -> см³)
        // V = h * w * d => V = (d*z*z) * (d*z) * d = d³ * z³
        depth = Math.pow((val * 1000) / Math.pow(z, 3), 1 / 3);
        wide = depth * z;
        tall = wide * z;
    }
    vol = (tall * wide * depth) / 1000; // литры
    return { tall, wide, depth, vol };
}
// счёт комнаты для прослушивания
function calculateKDP(id, val) {
    const z = 1.618;
    let height, width, length, square;
    if (id === 'KDP_height') {
        height = val;// высота
        width = height * z;// ширина = высота * 1.62
        length = width * z;// длина = ширина * 1.62
    } else if (id === 'KDP_width') {
        width = val;// ширина
        height = width / z;// высота = ширина 
        length = width * z;// длина = ширина * 1.62
    } else if (id === 'KDP_length') {
        length = val;// длина
        width = length / z;// ширина = длина / 1.62
        height = width / z;// высота = ширина / 1.62
    } else if (id === 'KDP_square') {
        square = val;// Расчет сторон из площади -
        height = Math.sqrt(square / (z ** 3));
        width = height * z;// ширина = высота * 1.62
        length = width * z;// длина = ширина * 1.62
    }
    square = (width * length); // площадь

    const viewport = document.querySelector('#room_viewport');
    if (viewport) { viewport.innerHTML = generateRoomSVG2D(width.toFixed(1), length.toFixed(1)); }
    return { height, length, width, square };
}

function helmholtzEngine(id) {
    const el = document.getElementById(id);
    if (!el) return;

    // 1. Чистим ввод (твой золотой стандарт)
    el.value = comma_point_correct(el.value);
    const val = parseFloat(el.value);

    // 2. Если поле пустое, мы не сбрасываем всё (как в КДП), 
    // а просто останавливаем расчет, пока цифра не появится
    if (isNaN(val)) return;

    let results = {};

    // Сценарий А: Пользователь меняет параметры порта или объем -> Считаем частоту
    if (['Helmholtz_V', 'Helmholtz_L', 'Helmholtz_W', 'Helmholtz_H'].includes(id)) {
        results = runHelmholtzMath('F');
    }
    // Сценарий Б: Пользователь меняет частоту -> Подбираем ширину щели
    else if (id === 'Helmholtz_F') {
        results = runHelmholtzMath('W');
    }

    // 3. Вывод результатов
    if (results) {
        Object.entries(results).forEach(([resId, resVal]) => {
            const input = document.getElementById(resId);
            if (input && resId !== id) {
                input.value = resVal;
                toggle_input_cssClass(input, true); // Подсвечиваем как вычисленное
            }
        });
    }
}

function runHelmholtzMath(targetVar) {
    const getV = (id) => parseFloat(document.getElementById(id)?.value) || 0;

    const V_lit = getV('Helmholtz_V');
    const L_mm = getV('Helmholtz_L');
    const W_mm = getV('Helmholtz_W');
    const H_mm = getV('Helmholtz_H');
    const F_hz = getV('Helmholtz_F');

    const c = 344; // скорость звука
    const V = V_lit / 1000;
    const L = L_mm / 1000;
    const W = W_mm / 1000;
    const H = H_mm / 1000;

    // 1. Расчет ЧАСТОТЫ (прямой)
    if (targetVar === 'F') {
        const S = W * H;
        if (V <= 0 || S <= 0) return null;

        // Эффективная длина с учетом порта на плоскости
        const L_eff = L + 0.85 * Math.sqrt(S);
        const freq = (c / (2 * Math.PI)) * Math.sqrt(S / (V * L_eff));

        return { 'Helmholtz_F': freq.toFixed(1) };
    }

    // 2. Расчет ШИРИНЫ (обратный через квадратное уравнение площади)
    if (targetVar === 'W') {
        if (V <= 0 || F_hz <= 0 || H <= 0) return null;

        const k = Math.pow((2 * Math.PI * F_hz) / c, 2); // (2pi*f/c)^2
        const M = V * k;

        /* Уравнение: S / (L + 0.85*sqrt(S)) = M
           Превращается в: 0.85*M*sqrt(S) + M*L - S = 0
           Это квадратное уравнение относительно x = sqrt(S):
           -x^2 + (0.85*M)x + (M*L) = 0
        */
        const a = -1;
        const b = 0.85 * M;
        const cc = M * L;

        const D = b * b - 4 * a * cc;
        if (D < 0) return null;

        const sqrtS = (-b - Math.sqrt(D)) / (2 * a);
        const S_final = sqrtS * sqrtS;
        const W_calc = (S_final / H) * 1000;

        return { 'Helmholtz_W': W_calc.toFixed(1) };
    }
    return null;
}
//============================================

function generateBoltGraphSVG() {
    // Получаем данные из инпутов (используя вашу функцию очистки запятых)
    const h_val = typeof comma_point_correct === 'function' ? comma_point_correct(document.getElementById('height_test')?.value) : 0;
    const w_val = typeof comma_point_correct === 'function' ? comma_point_correct(document.getElementById('width_test')?.value) : 0;
    const l_val = typeof comma_point_correct === 'function' ? comma_point_correct(document.getElementById('length_test')?.value) : 0;

    const viewBoxSize = 400;
    const minK = 1.0;
    const maxK = 3.0;
    const range = maxK - minK;

    const padL = 45; // Отступ слева под цифры
    const padB = 40; // Отступ снизу под цифры
    const graphArea = viewBoxSize - padL - 15;

    // Функции проекции координат в пиксели SVG
    const toPxX = (k) => padL + ((k - minK) / range) * graphArea;
    const toPxY = (k) => (viewBoxSize - padB) - ((k - minK) / range) * graphArea;

    // Вспомогательная функция для сборки полигонов зон
    const getPolyPoints = (pts) => pts.map(p => `${toPxX(p.x)},${toPxY(p.y)}`).join(' ');

    // Координаты зон Болта
    const zones = [
        { id: 'narrow', pts: [{ x: 1.2, y: 1.3 }, { x: 1.31, y: 1.88 }, { x: 1.71, y: 1.88 }] },
        { id: 'gold', pts: [{ x: 1.36, y: 2.11 }, { x: 1.88, y: 2.11 }, { x: 1.88, y: 2.83 }, { x: 1.52, y: 2.83 }] },
        { id: 'top', pts: [{ x: 2.11, y: 2.31 }, { x: 2.11, y: 2.83 }, { x: 2.59, y: 2.83 }] }
    ];

    // Сетка (линии через 0.2)
    let gridLines = '';
    for (let k = minK; k <= maxK; k += 0.2) {
        const pX = toPxX(k); // Позиция для вертикальной линии
        const pY = toPxY(k); // Позиция для горизонтальной линии

        // Вертикальные линии (фиксированный X)
        gridLines += `<line x1="${pX}" y1="${toPxY(minK)}" x2="${pX}" y2="${toPxY(maxK)}" class="grid-line" />`;

        // Горизонтальные линии (фиксированный Y)
        gridLines += `<line x1="${toPxX(minK)}" y1="${pY}" x2="${toPxX(maxK)}" y2="${pY}" class="grid-line" />`;
    }
    // Подписи осей
    let labels = '';
    for (let k = minK; k <= maxK; k += 0.4) { // Шаг 0.4 для меток, чтобы не частить
        const val = k.toFixed(1);
        labels += `<text x="${toPxX(k)}" y="${viewBoxSize - padB + 20}" class="text-dim" text-anchor="middle">${val}</text>`;
        labels += `<text x="${padL - 10}" y="${toPxY(k) + 4}" class="text-dim" text-anchor="end">${val}</text>`;
    }
    // Точка пользователя и инфо-текст
    let userPoint = '';
    let infoText = '';
    if (h_val > 0 && w_val > 0 && l_val > 0) {
        const kX = w_val / h_val;
        const kY = l_val / h_val;
        const f1 = (344 / (2 * h_val)).toFixed(0);
        const f2 = ((344 / (2 * h_val)) * 2).toFixed(0);
        const f3 = ((344 / (2 * h_val)) * 3).toFixed(0);
        const qW = ((344 / f3) / 4 * 1000).toFixed(0);
        userPoint = `<circle cx="${toPxX(kX)}" cy="${toPxY(kY)}" r="6" class="user-dot" filter="url(#glow)" />`;
        infoText = `
            <g transform="translate(${viewBoxSize - 10}, ${viewBoxSize - padB - 10})" text-anchor="end">
                <text y="-80" class="text-info">F1: ${f1}Hz</text>
                <text y="-60" class="text-info">F2: ${f2}Hz</text>
                <text y="-40" class="text-info">F3: ${f3}Hz</text>
                <text y="-20" class="text-info">S: ${(w_val * l_val).toFixed(1)}m²</text>
                <text y="0" class="text-info" >\u03BB(f₃)/4: ${qW}mm</text>
            </g>`;
    }
    return `
    <svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
        <defs>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <!-- Усиливаем яркость размытия (умножаем прозрачность) -->
        <feColorMatrix in="blur" type="matrix" 
            values="0 0 0 0 1
                    0 0 0 0 0.2
                    0 0 0 0 0
                    0 0 0 1.5 0" result="boost" />
        <feComposite in="SourceGraphic" in2="boost" operator="over" />
    </filter>
        </defs>
        <style>
            .grid-line { stroke: #ff9900; stroke-width: 0.2; }
            .axis { stroke: #ff9900; stroke-width: 1.5; fill: none; }
            .bolt-zone { fill: rgba(0, 255, 0, 0.35); stroke: rgba(0, 255, 0, 0.5); stroke-width: 1; }
            .text-dim { fill: #ff9900; font-family: monospace; font-size: 12px; }
            .text-info { fill: #ff9900; font-family: monospace; font-size: 16px; font-weight: bold; }
            .user-dot { fill: #ff3300; }
        </style>        
        ${gridLines}        
        ${zones.map(z => `<polygon points="${getPolyPoints(z.pts)}" class="bolt-zone" />`).join('')}        
        <path d="M ${padL} 10 L ${padL} ${viewBoxSize - padB} L ${viewBoxSize - 10} ${viewBoxSize - padB}" class="axis" />        
        ${labels}
        ${infoText}
        ${userPoint}
    </svg>`;
}



function generateRoomSVG2D(rw, rl) {
    // rw - ширина (5м), rl - длина (8м)
    // Коэффициенты по Кардасу
    const x = (rw * 0.276).toFixed(2); // Расстояние до боковой стены
    const y = (rw * 0.447).toFixed(2); // Расстояние до фронтальной стены

    // Масштабирование для ViewBox (база 400x600)
    const scale = 350 / rw;
    const svgW = 400;
    const svgH = (rl * scale) + 100;

    // Координаты динамиков
    const spkLX = 25 + (x * scale);
    const spkRX = (rw * scale) + 25 - (x * scale);
    const spkY = 50 + (y * scale);
    const baseB = spkRX - spkLX;
    const listenX = (spkLX + spkRX) / 2;
    const listenY = spkY + (baseB * 0.866);
    return `
    <svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
    <defs>
    <marker id="tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <line x1="5" y1="0" x2="5" y2="10" stroke="#f97316" stroke-width="2" />
    </marker>
    </defs>
        <style>
        .wall-outer { stroke: rgba(0, 255, 0, 0.4); stroke-width: 4; fill: none; }
        .wall-inner { stroke: rgba(0, 255, 0, 0.4); stroke-width: 1; fill: none; }           
            .dim-line { stroke: #a34e00; stroke-width: 1; marker-start: url(#tick); marker-end: url(#tick); }
            .axis-line { stroke: #f97316; stroke-width: 1; stroke-dasharray: 4; } /* Оранжевый */
            .speaker { fill: none; stroke: #a34e00; stroke-width: 2; }
            .text-main { fill: #f97316; font-family: monospace; font-size: 16px; font-weight: bold; }
            .text-dim { fill: #f97316; font-family: monospace; font-size: 14px; }
            .listener { fill: #f97316; }
            .stereo-zone { 
                fill: #f97316;       /* Цвет зоны (сейчас оранжевый как у слушателя) */
                fill-opacity: 0.15;  /* Прозрачность (0.1 - почти не видно, 1.0 - глухой цвет) */
                stroke: #a34e00;    /* Цвет контура */
                stroke-width: 0.5;
                stroke-dasharray: 2; /* Пунктирный контур */
            }
        </style>
        <!-- 
        ЗОНА СТЕРЕОЭФФЕКТА 
        Находится ЗА слушателем. 
        M - вершина (чуть выше слушателя), 
        Q - кривые Безье для эффекта "провала" внутрь (экспонентоподобно).
        Чтобы подвинуть: измени listenY + [число] 
     -->
     <path d="M ${listenX} ${listenY - 90} 
              Q ${listenX - 20} ${listenY + 100} ${listenX - 120} ${listenY + 200} 
              L ${listenX + 120} ${listenY + 200} 
              Q ${listenX + 20} ${listenY + 100} ${listenX} ${listenY - 90}" 
           class="stereo-zone" />
        <!-- Стены комнаты -->
        <rect x="25" y="50" width="${rw * scale}" height="${rl * scale}" class="wall-outer" />
        <rect x="28" y="53" width="${(rw * scale) - 6}" height="${(rl * scale) - 6}" class="wall-inner" />

        <!-- Размерные линии: Ширина (верх) -->
        <line x1="25" y1="30" x2="${(rw * scale) + 25}" y2="30" class="dim-line" />
        <text x="${(rw * scale) / 2}" y="25" class="text-dim">${rw} м.</text>

        <!-- Размерные линии: Длина (право) -->
        <line x1="${(rw * scale) + 45}" y1="50" x2="${(rw * scale) + 45}" y2="${(rl * scale) + 50}" class="dim-line" />
        <text x="${(rw * scale) + 32}" y="${(rl * scale) / 2 + 50}" class="text-dim" transform="rotate(90 ${(rw * scale) + 32} ${(rl * scale) / 2 + 50})">${rl} м.</text>

        <!-- Колонки (схематично как на рисунке) -->
        <g id="spkL" transform="rotate(-30 ${spkLX} ${spkY})">
            <path d="M ${spkLX - 15} ${spkY - 20} L ${spkLX + 15} ${spkY - 20} L ${spkLX + 20} ${spkY} L ${spkLX - 20} ${spkY} Z" class="speaker" />
            <rect x="${spkLX - 5}" y="${spkY - 30}" width="10" height="10" class="speaker" />
        </g>
        
        <g id="spkR" transform="rotate(30 ${spkRX} ${spkY})">
            <path d="M ${spkRX - 15} ${spkY - 20} L ${spkRX + 15} ${spkY - 20} L ${spkRX + 20} ${spkY} L ${spkRX - 20} ${spkY} Z" class="speaker" />
            <rect x="${spkRX - 5}" y="${spkY - 30}" width="10" height="10" class="speaker" />
        </g>

        <!-- Линии привязки X и Y -->
        <line x1="25" y1="${spkY}" x2="${spkLX}" y2="${spkY}" class="dim-line" />
        <text x="35" y="${spkY - 5}" class="text-dim">${x} м.</text>

        <line x1="${spkRX}" y1="${spkY}" x2="${(rw * scale) + 25}" y2="${spkY}" class="dim-line" />
        <text x="${spkRX + 28}" y="${spkY - 5}" class="text-dim">${x} м.</text>

        <line x1="${svgW / 2}" y1="50" x2="${svgW / 2}" y2="${spkY}" class="axis-line" />
        <text x="${svgW / 2 + 5}" y="${50 + (y * scale) / 2}" class="text-main" transform="rotate(90 ${svgW / 2 + 5} ${50 + (y * scale) / 2})">${y} м.</text>

        <!-- Слушатель -->
        <circle cx="${svgW / 2}" cy="${spkY + (spkRX - spkLX) * 0.866}" r="5" class="listener" />
        <text x="${svgW / 2 - 40}" y="${spkY + (spkRX - spkLX) * 0.866 + 25}" class="text-main">Слушатель</text>

        <!-- Зона стереоэффекта -->
        <circle cx="${svgW / 2}" cy="${spkY + (spkRX - spkLX) * 0.866}" r="5" class="listener" />
        <text x="${svgW / 2 - 70}" y="${spkY + (spkRX - spkLX) * 0.866 + 180}" class="text-dim">Зона стереоэффекта</text>
        <!-- Равносторонний треугольник (пунктир) -->
        <path d="M ${spkLX} ${spkY} L ${spkRX} ${spkY} L ${svgW / 2} ${spkY + (spkRX - spkLX) * 0.866} Z" fill="none" stroke="#f97316" stroke-width="1" stroke-dasharray="2" />
    </svg>
    `;
}

//============================================

function calculateStandard(val1, val2, operator) {
    let result = 0;
    // Сравниваем operator со значениями из твоего массива calc_configs
    switch (operator) {
        case calc_configs[0].value: result = val1 + val2; break; // '+'
        case calc_configs[1].value: result = val1 - val2; break; // '-'
        case calc_configs[2].value: result = val1 * val2; break; // '*'
        case calc_configs[3].value: result = val1 / val2; break; // '/'
        case calc_configs[4].value: result = Math.pow(val1, val2); break; // '^'
        case calc_configs[5].value: result = Math.pow(val1, 1 / val2); break; // '√'
        case calc_configs[6].value: result = val1 % val2; break; // '%'
        case calc_configs[7].value: result = factorial(val1); break; // 'A!'
        case calc_configs[8].value: result = Math.sin(val1); break; // 'sin'
        case calc_configs[9].value: result = Math.cos(val1); break; // 'cos'
        case calc_configs[10].value: result = Math.log(val1) / Math.log(val2); break; // 'log'
        default: return null;
    }

    function factorial(n) {
        if (n < 0) return NaN;
        let res = 1;
        for (let i = 2; i <= Math.min(n, 170); i++) res *= i;
        return res;
    }
    return result;
}

function runCalculator() {
    // 1. ОФИЦИАНТ СОБИРАЕТ ДАННЫЕ
    const op1Val = parseFloat(document.getElementById('op1').value) || 0;
    const op2Val = parseFloat(document.getElementById('op2').value) || 0;
    const operator = document.getElementById('dey').value;
    const otvet = document.getElementById('otvet');
    // 2. ОФИЦИАНТ ПЕРЕДАЕТ ЗАКАЗ ПОВАРУ И ПОЛУЧАЕТ ОТВЕТ
    const result = calculateStandard(op1Val, op2Val, operator);
    // 3. ВЫВОД В ИНТЕРФЕЙС (с проверками)
    if (result === Infinity) { otvet.value = ''; otvet.placeholder = 'Бесконечность'; return; }
    if (isNaN(result) || result === null) { otvet.value = ''; return; }
    otvet.value = parseFloat(result.toFixed(10));
}
//---------------------------

//--------Г-Е-Н-Е-Р-А-Т-О-Р--------------------
//----------Г-Е-Н-Е-Р-А-Т-О-Р--------------------
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let isPlaying = false;



function sineSwith() {
    const btn = document.getElementById('sbros');
    const display = document.getElementById('freq_display');
    const freqInput = document.getElementById('freq');
    // Обновляем текст частоты
    if (display) display.innerText = freqInput.value + ' Hz';

    if (isPlaying) {
        // --- СТОП ---
        if (gainNode) {
            // Плавное затухание (убираем щелчок при выключении)
            // 1. Делаем затухание очень быстрым (0.1 сек), чтобы кнопка была отзывчивой
            const rampTime = 0.1;

            // 2. Рампа до очень маленького значения (почти тишина)
            // gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + rampTime);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
            // 3. Останавливаем осциллятор чуть позже, чем закончится затухание
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                isPlaying = false;
                btn.innerText = 'П У С К';
            }, (rampTime * 1000) + 99); // +20 мс для надежности
        }
    } else {
        // --- ПУСК ---
        // Инициализируем контекст только по клику (требование браузеров)
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Создаем фильтр
        const filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'lowpass'; // Тип фильтра
        filterNode.frequency.value = 400; // Частота среза (Hz), с которой начинается подавление
        filterNode.Q.value = 1; // Добротность (резонанс), 1 — обычно достаточно
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();

        // Настройка
        oscillator.type = 'sine';
        const freqVal = document.getElementById('freq').value;
        const ampVal = document.getElementById('amplitude').value / 100;

        oscillator.frequency.setValueAtTime(freqVal, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Начинаем с тишины

        oscillator.connect(gainNode);
        gainNode.connect(filterNode); // Gain идет в фильтр
        filterNode.connect(audioCtx.destination); // Фильтр идет в выход

        oscillator.start();

        // Плавное нарастание (убираем щелчок при включении)
        gainNode.gain.linearRampToValueAtTime(ampVal, audioCtx.currentTime + 0.05);

        isPlaying = true;
        btn.innerText = 'С Т О П';
    }
}

function sineEngine(id) {
    const freqInput = document.getElementById('freq');
    const ampInput = document.getElementById('amplitude');
    const display = document.getElementById('freq_display');

    // Обновляем текст частоты
    if (display) display.innerText = freqInput.value + ' Hz';

    // Если звук играет, применяем изменения плавно
    if (isPlaying && audioCtx) {
        const now = audioCtx.currentTime;

        // Плавное изменение частоты (без щелчков)
        oscillator.frequency.setTargetAtTime(parseFloat(freqInput.value), now, 0.05);

        // Плавное изменение громкости (без щелчков)
        gainNode.gain.setTargetAtTime(parseFloat(ampInput.value) / 100, now, 0.05);
    }
}



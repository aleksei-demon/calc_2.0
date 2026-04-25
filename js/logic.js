

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
    // ПРИНУДИТЕЛЬНАЯ ЧИСТКА: Удаляем "qwerty" и лишние точки прямо в поле
    const cleanedValue = comma_point_correct(el.value);
    if (el.value !== cleanedValue) {
        el.value = cleanedValue;
    }
    const val = parseFloat(el.value);

    // Если мы на экране теста комнаты
    if (id.includes('_test')) {
        drawPreciseBoltGraph(); // перерисовываем график при каждом нажатии клавиши        
        return;
    }
    if (document.body.classList.contains('body_calc')) { runCalculator(); return; } // Обычный калькулятор

    if (isNaN(val) || el.value === '') {
        // Если стерли — очищаем все поля этого экрана       
        const inputs = el.closest('form').querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
            toggle_input_cssClass(input, false);
        });
        return;
    }

    // Красим текущее поле как ввод пользователя 
    toggle_input_cssClass(el, false);

    let results = null;
    if (id.includes('KDP_')) { results = calculateKDP(id, val); }
    if (document.body.classList.contains('body_spk')) { results = calculateSpeaker(id, val); }
    if (id.includes('Helmholtz')) { calculateHelmholtz(id, val); console.log(id); }
    // Выводим результаты
    // Выводим результаты
    if (results) {
        Object.entries(results).forEach(([resId, resVal]) => {
            // Если мы работаем с КДП, добавляем префикс к ключу, чтобы найти инпут
            const finalId = id.includes('KDP_') ? 'KDP_' + resId : resId;

            if (finalId !== id) {
                const input = document.getElementById(finalId); // Теперь он найдет "KDP_height"
                if (input) {
                    input.value = parseFloat(Number(resVal).toFixed(1));
                    toggle_input_cssClass(input, true);
                }
            }
        });
    }
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
    return { height, length, width, square };
    //err_of_small_height();
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

    const c = 344;
    const V = V_lit / 1000;
    const L = L_mm / 1000;
    const W = W_mm / 1000;
    const H = H_mm / 1000;

    // Расчет частоты (F) из размеров
    if (targetVar === 'F') {
        const S = W * H;
        if (V <= 0 || S <= 0) return null;

        // Поправка на концевое удлинение для прямоугольного отверстия
        const deltaL = 0.825 * Math.sqrt(S);
        const freq = (c / (2 * Math.PI)) * Math.sqrt(S / (V * (L + deltaL)));

        return { 'Helmholtz_F': freq.toFixed(1) };
    }

    // Расчет ширины щели (W) из частоты
    if (targetVar === 'W') {
        if (V <= 0 || F_hz <= 0 || H <= 0) return null;

        // k = (2pi * f / c)^2
        const k = Math.pow((2 * Math.PI * F_hz) / c, 2);

        /* Тут физика: S / (V * (L + 0.825*sqrt(S))) = k
           Для упрощения и стабильности без итераций:
           При малых L (доска 16мм) доминирует поправка.
           Найдем требуемую площадь S через квадратное уравнение 
           или через прямое соотношение S = V * k * (L + поправка).
        */
        const S_approx = V * k * (L + 0.1); // Грубое приближение для старта
        const deltaL = 0.825 * Math.sqrt(S_approx);
        const S_final = V * k * (L + deltaL);

        const W_calc = (S_final / H) * 1000; // в мм
        return { 'Helmholtz_W': W_calc.toFixed(1) };
    }
    return null;
}
//============================================



function drawPreciseBoltGraph() {
    const canvas = document.getElementById('disp');
    if (!canvas) return;
    syncCanvasSize(canvas);
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;
    // Константы диапазона (диапазон координат на графике: 2.0)
    const minK = 1.0;
    const maxK = 3.0;
    const range = maxK - minK;
    // Адаптивные отступы
    const padL = cw * 0.1; // отступ слева (для цифр Y)
    const padB = ch * 0.1; // отступ снизу (для цифр X)
    const graphW = cw - padL - 10;
    const graphH = ch - padB - 10;
    // ИСПРАВЛЕННЫЕ функции перевода координат
    const toPxX = (k) => padL + ((k - minK) / range) * graphW;
    const toPxY = (k) => (ch - padB) - ((k - minK) / range) * graphH;
    // --- 1. ФОН ---    
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, cw, ch);
    // --- 2. СЕТКА ---
    ctx.strokeStyle = '#ff9900'; // оранжевый
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    for (let k = minK; k <= maxK; k += 0.2) {
        // Вертикали
        ctx.moveTo(toPxX(k), toPxY(minK));
        ctx.lineTo(toPxX(k), toPxY(maxK));
        // Горизонтали
        ctx.moveTo(toPxX(minK), toPxY(k));
        ctx.lineTo(toPxX(maxK), toPxY(k));
    }
    ctx.stroke();
    // --- 3. ИСПРАВЛЕННЫЕ ТОЧНЫЕ ЗОНЫ БОЛТА (Координаты из оригинала) ---
    const zoneColor = 'rgba(0, 255, 0, 0.4)'; // полупрозрачный зеленый
    // Функция отрисовки одного полигона
    const drawPoly = (pts) => {
        ctx.fillStyle = zoneColor;
        ctx.beginPath();
        ctx.moveTo(toPxX(pts[0].x), toPxY(pts[0].y));
        for (let i = 1; i < pts.length; i++) ctx.lineTo(toPxX(pts[i].x), toPxY(pts[i].y));
        ctx.closePath();
        ctx.fill();
    };
    // 1. Левая нижняя узкая зона
    drawPoly([{ x: 1.2, y: 1.3 }, { x: 1.31, y: 1.88 }, { x: 1.71, y: 1.88 }]);
    // 2. Центральная зона (Золотая) — более узкая и лежит вдоль диагонали
    drawPoly([{ x: 1.36, y: 2.11 }, { x: 1.88, y: 2.11 }, { x: 1.88, y: 2.83 }, { x: 1.52, y: 2.83 },]);
    // 3. Правая верхняя зона (Треугольник) — смещена левее
    drawPoly([{ x: 2.11, y: 2.31 }, { x: 2.11, y: 2.83 }, { x: 2.59, y: 2.83 }]);
    // --- 4. ОСИ, ЦИФРЫ И МЕТКИ ---
    ctx.strokeStyle = '#ff9900'; // оранжевый
    ctx.fillStyle = '#ff9900';
    ctx.lineWidth = 1;
    ctx.font = `${Math.round(cw * 0.038)}px Courier New`; // адаптивный шрифт
    // Ось X
    ctx.beginPath();
    ctx.moveTo(padL, ch - padB); ctx.lineTo(cw - 10, ch - padB);
    ctx.stroke();
    // Ось Y
    ctx.beginPath();
    ctx.moveTo(padL, ch - padB); ctx.lineTo(padL, 10);
    ctx.stroke();
    // Подписи делений и деления
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let k = minK; k <= maxK; k += 0.2) {
        let val = k.toFixed(1);
        const ptX = toPxX(k);
        const ptY = toPxY(k);
        // X числа и деления
        ctx.fillRect(ptX - 1, ch - padB, 1, cw * 0.015); // деления (риски)
        ctx.fillText(val, ptX, ch - padB + cw * 0.05);   // числа
        // Y числа и деления
        ctx.fillRect(padL - cw * 0.015, ptY - 1, cw * 0.015, 1); // деления (риски)
        ctx.fillText(val, padL - cw * 0.06, ptY + 2);            // числа
    }
    // --- 5. ТОЧКА ПОЛЬЗОВАТЕЛЯ ---
    const h = comma_point_correct(document.getElementById('height_test')?.value);
    const w = comma_point_correct(document.getElementById('width_test')?.value);
    const l = comma_point_correct(document.getElementById('length_test')?.value);
    if (h > 0 && w > 0 && l > 0) {
        const userK_X = w / h;
        const userK_Y = l / h;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'red';
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        // Используем исправленные toPxX и toPxY
        ctx.arc(toPxX(userK_X), toPxY(userK_Y), cw * 0.018, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    // --- 6. ИНФОРМАЦИОННЫЙ ВЫВОД (F1, F2, F3 и S) ---
    if (h > 0 && w > 0 && l > 0) {
        // Расчет мод: v/(2h) * n
        const f1 = (344 / (2 * h)).toFixed(0);
        const f2 = (f1 * 2).toFixed(0);
        const f3 = (f1 * 3).toFixed(0);
        const area = (w * l).toFixed(0);

        // Настройки шрифта: 150% от cw * 0.04 ≈ cw * 0.06
        const fontSize = Math.round(cw * 0.06);
        ctx.font = `bold ${fontSize}px Courier New`;
        ctx.fillStyle = '#ff9900';
        ctx.textAlign = 'right';

        // Позиционирование: правый нижний угол, выше оси X
        const textX = cw - 15;
        let currentY = ch - padB - 20;

        // Вывод в столбик снизу вверх
        // Используем Unicode: ₁₂₃ для подстрочных и ² для надстрочного
        ctx.fillText(`S=${area}m²`, textX, currentY);
        currentY -= fontSize * 1.2; // Смещение вверх на высоту строки
        ctx.fillText(`F₃=${f3}Hz`, textX, currentY);
        currentY -= fontSize * 1.2;
        ctx.fillText(`F₂=${f2}Hz`, textX, currentY);
        currentY -= fontSize * 1.2;
        ctx.fillText(`F₁=${f1}Hz`, textX, currentY);
    }
}


function syncCanvasSize(canvas) {
    // Получаем реальную ширину, которую выделил браузер (через CSS)
    const rect = canvas.getBoundingClientRect();
    // Приравниваем внутреннее разрешение к экранному
    // Теперь 1 пиксель кода = 1 пиксель экрана. Ноль размытия!
    canvas.width = rect.width;
    canvas.height = rect.width; // Раз он квадратный
}
//============================================


//---------------------------
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











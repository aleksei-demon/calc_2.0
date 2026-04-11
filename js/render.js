
/*
RENDER.JS - отрисовка экранов
================================================================================
ДОКУМЕНТАЦИЯ APRENDER.JS (v2.0 — 2026)
================================================================================

1. appender(params) — Создание одного элемента.
   Принимает объект {}. Все параметры необязательны.
   -----------------------------------------------------------------------------
   tag:       'div' (дефолт), 'input', 'button', 'select', 'style' и т.д.
   to:        Куда вставить? Селектор (например, '#form') или 'body' (дефолт).
   id:        Уникальный идентификатор элемента.
   className: CSS классы (строкой).
   content:   Для тегов: innerHTML. 
              Для input: значение 'inputmode' (numeric, text, decimal).
              Для form: значение 'action'.
   hold:      Умный атрибут. 
              Для input -> placeholder, для img -> src, для a -> href, 
              Для ol -> type, для abbr -> title.
   style:     Объект со стилями. Пример: { color: 'red', fontSize: '12px' }.
   attr:      Объект для любых других атрибутов. Пример: { min: 0, max: 100 }.
   on[Event]: Обработчик события. Пример: onclick: (e) => console.log(e.target).
              Поддерживает: onclick, oninput, onchange, ondblclick.

   Пример: appender({ tag: 'input', id: 'u_in', hold: 'Вольты', oninput: Ohm });

   -----------------------------------------------------------------------------

2. gen(data, commonParams) — Массовая генерация.
   -----------------------------------------------------------------------------
   ВАРИАНТ А (Число): gen(5, { tag: 'button', id: 'btn' });
   Создаст 5 кнопок с ID: btn_0, btn_1, btn_2, btn_3, btn_4.

   ВАРИАНТ Б (Массив): gen([{id: 'A'}, {id: 'B'}], { tag: 'input', to: '#f' });
   Создаст разные элементы по "чертежу", подмешивая общие параметры (to, tag).

   -----------------------------------------------------------------------------

3. adaptive(selector, vh, vw, portr_h, portr_w) — Динамический размер.
   -----------------------------------------------------------------------------
   selector: Кого менять ('.item').
   vh / vw:  Высота и ширина в % от экрана для ЛАНДШАФТА.
   portr_h / portr_w: Высота и ширина в % от экрана для ПОРТРЕТА.

   -----------------------------------------------------------------------------

4. clear(selector) — Очистка контейнера.
   -----------------------------------------------------------------------------
   clear('#form'); // Очистит содержимое элемента #form.
   clear('');      // Очистит весь body.

================================================================================
*/

// const nav_labels = ['&nbsp;ЧИСЛОБОГ', '&nbsp;закон Ома', '&nbsp;&nbsp;Т. В. З.', '&nbsp;&nbsp;К. Д. П.', '&nbsp;Корпус А.С.'];

// Названия разделов (теперь это просто массив данных)
const nav_configs = [
    { label: '&nbsp;ЧИСЛОБОГ', value: 'ЧИСЛОБОГ', selected: true },
    { label: '&nbsp;закон Ома', value: 'закон Ома' },
    { label: '&nbsp;&nbsp;Т. В. З.', value: 'Т. В. З.' },
    { label: '&nbsp;&nbsp;К. Д. П.', value: 'К. Д. П.' },
    { label: '&nbsp;Корпус А.С.', value: 'Корпус А.С.' }
];


function draw_init() {
    clear('');
    // 1. Создаем Хедер
    const header = appender({ tag: 'header', id: 'header', to: 'body' });
    // 2. Создаем Форму внутри Хедера (критично для CSS!)
    const navForm = appender({
        tag: 'form',
        id: 'form2',
        to: header
    });
    // 3. Создаем Селект внутри Формы
    const menu = appender({
        tag: 'select',
        to: navForm, // Кладём в форму, а не в хедер напрямую
        id: 'nav',
        className: 'select', // Добавил класс из инспектора
        onchange: (e) => switchScreen(e.target.value)
    });
    // Генерация опций (оставляем как была)
    gen(nav_configs.map(item => ({
        tag: 'option',
        content: item.label,
        className: 'body_calc',
        attr: {
            value: item.value,
            ...(item.selected ? { selected: 'selected' } : {})
        }
    })), { to: '#nav' });
    // Главный контейнер для контента
    appender({ tag: 'main', id: 'app_content', to: 'body' });
    const startScreen = nav_configs.find(i => i.selected).value;
    switchScreen(startScreen);
    window.addEventListener('resize', () => {
        if (document.getElementById('disp')) drawPreciseBoltGraph();
    });
}


function switchScreen(name) {
    inputQueue = []; // Обнуляем очередь при каждом переходе
    const main = document.getElementById('app_content');
    const menu = document.getElementById('nav');
    // Синхронизируем заголовок селекта с выбранным разделом
    if (menu) menu.value = name;
    clear('#app_content');
    // Твои цветовые темы из CSS
    const themes = {
        "закон Ома": "body_ohms",
        "Т. В. З.": "body_trans",
        "К. Д. П.": "body_kdp",
        "Корпус А.С.": "body_spk",
        "ЧИСЛОБОГ": "body_calc"
    };
    document.body.className = themes[name] || 'body_calc';
    // Вызов отрисовки конкретного контента
    if (name === "закон Ома") draw_ohm('#app_content');
    if (name === "Т. В. З.") draw_TVZ('#app_content');
    if (name === "К. Д. П.") draw_KDP('#app_content');
    if (name === "Корпус А.С.") draw_speaker('#app_content');
    if (name === "ЧИСЛОБОГ") draw_calc('#app_content');
}

// Запуск приложения при загрузке страницы
window.onload = draw_init;

const calcFields = [
    { id: 'op1', hold: ' A', className: 'inputs user_fill', },
    { id: 'dey', tag: 'select', className: 'select', },
    { id: 'op2', hold: ' Б', className: 'inputs user_fill' },
    { id: 'otvet', hold: ' ответ', className: 'inputs result_fill', attr: { readonly: 'readonly' } }
];
const calc_configs = [
    { label: '&nbsp;&nbsp;+', value: '+', selected: true },
    { label: '&nbsp;&nbsp;-', value: '-' },
    { label: '&nbsp;&nbsp;*', value: '*' },
    { label: '&nbsp;&nbsp;/', value: '/' },
    { label: '^ &nbsp;&nbsp; А в степень Б', value: '^' },
    { label: '&#8730; &nbsp;&nbsp; степени Б из А', value: '&#8730;' },
    { label: '% &nbsp;&nbsp; остаток от А/Б ', value: '%' },
    { label: 'А! &nbsp;&nbsp; факториал', value: 'А!' },
    { label: 'sin &nbsp;&nbsp;А', value: 'sin' },
    { label: 'cos &nbsp;&nbsp;А', value: 'cos' },
    { label: 'log &nbsp;&nbsp; логарифм А по осн. Б', value: 'log' },
];
function draw_calc(target) {
    const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
    targetEl.innerHTML = '';

    // Собираем опции
    const options = calc_configs.map(item =>
        h('option.body_calc', {
            value: item.value,
            selected: item.selected || false,
            innerHTML: item.label
        })
    );

    // Собираем форму одним деревом
    const form = h('form#form', { onsubmit: (e) => e.preventDefault() }, [
        h('input#op1.inputs.user_fill', { placeholder: ' A', inputmode: 'decimal', oninput: (e) => oneOpCalculation(e.target.id) }),

        // ВАЖНО: Селект создается сразу с детьми!
        h('select#dey.select', {}, options),

        h('input#op2.inputs.user_fill', { placeholder: ' Б', inputmode: 'decimal', oninput: (e) => oneOpCalculation(e.target.id) }),
        h('input#otvet.inputs.result_fill', { placeholder: ' ответ', readOnly: true }),

        h('div.btn-container', {}, [
            h('button#sbros.inputs', { innerText: 'С Б Р О С', onclick: () => switchScreen('ЧИСЛОБОГ') })
        ]),

        h('p#explanation', { innerHTML: 'Даблклик на поле ввода даст число π, следующий число е, а третий 1/2π <br><br><br> Клик на поле "Ответ" скопирует его в буфер обмена' })
    ]);

    targetEl.append(form);
}



const ohmFields = [
    { id: 'voltage', label: 'u&nbsp;', hold: 'напряжение' },
    { id: 'current', label: 'i&nbsp;', hold: 'сила тока' },
    { id: 'Resistance', label: 'r&nbsp;', hold: 'сопротивление' },
    { id: 'power', label: 'p&nbsp;', hold: 'мощность' }
];
function draw_ohm(target) {
    const targetEl = document.querySelector(target);
    targetEl.innerHTML = '';

    const content = h('div.ohm-container', {}, [
        h('h2', { innerText: 'Закон Ома' }),
        h('div.input-group', {}, [
            h('label', { innerText: 'Напряжение (U)' }, [
                h('input#u_val.inputs', { placeholder: 'Вольты', oninput: calculateOhm })
            ]),
            h('label', { innerText: 'Сопротивление (R)' }, [
                h('input#r_val.inputs', { placeholder: 'Омы', oninput: calculateOhm })
            ])
        ]),
        h('div#result_ohm', { className: 'result-box', innerText: 'Ток: --' })
    ]);

    targetEl.append(content);
}
// function draw_ohm(target) {
//     clear(target);
//     const form = appender({ tag: 'form', id: 'form', to: target });
//     form.onsubmit = (e) => e.preventDefault();
//     // Генерируем инпуты
//     gen(ohmFields, {
//         tag: 'input',
//         to: form,
//         className: 'inputs ohm',
//         content: 'decimal',
//         // вызов рассчета принимая очередь из двух значений
//         oninput: (e) => handleOnInput(e.target.id)
//     });
//     // СОЗДАЕМ КОНТЕЙНЕР ДЛЯ КНОПОК
//     const btnBox = appender({ tag: 'div', className: 'btn-container', to: form });
//     // КНОПКИ КЛАДЕМ ИМЕННО В btnBox
//     appender({
//         tag: 'button',
//         content: 'С Б Р О С',
//         to: btnBox, // <--- Важно!
//         className: 'inputs',
//         id: 'sbros',
//         onclick: () => switchScreen('закон Ома')
//     });
//     appender({
//         tag: 'p',
//         to: form,
//         content: 'Введите любую пару параметров...',
//         //className: 'explanation',
//         id: 'explanation',
//     });
//     for (all of document.querySelectorAll('option')) { all.className = 'body_ohms'; }
// }


const TVZFields = [
    { id: 'ktr_', label: 'К.', sub: 'тр.&nbsp;&nbsp;&nbsp;&nbsp;', hold: 'соотн. числа витков' },
    { id: 'loadR_', label: 'R', sub: 'нагр.&nbsp;&nbsp;', hold: 'R нагр. УНЧ., Ом' },
    { id: 'anodR_', label: 'R.', sub: 'анод.&nbsp;', hold: 'R Анода, Ом' },
];
function draw_TVZ(target) {
    clear(target);
    const form = appender({ tag: 'form', id: 'form', to: target });
    form.onsubmit = (e) => e.preventDefault();
    // Генерируем инпуты
    gen(TVZFields, {
        tag: 'input',
        to: form,
        className: 'inputs trans',
        content: 'decimal',
        // вызов рассчета принимая очередь из двух значений
        oninput: (e) => handleOnInput(e.target.id)
    });
    // СОЗДАЕМ КОНТЕЙНЕР ДЛЯ КНОПОК
    const btnBox = appender({ tag: 'div', className: 'btn-container', to: form });
    // КНОПКИ КЛАДЕМ ИМЕННО В btnBox
    appender({
        tag: 'button',
        content: 'С Б Р О С',
        to: btnBox, // <--- Важно!
        className: 'inputs',
        id: 'sbros',
        onclick: () => switchScreen('Т. В. З.')
    });
    appender({
        tag: 'p',
        to: form,
        content: 'Расчёт приведённого сопротивления выходного трансформатора лампового УНЧ',
        //className: 'explanation',
        id: 'explanation',
    });
    for (all of document.querySelectorAll('option')) { all.className = 'body_trans'; }
}


const speakerFields = [
    { id: 'tall', label: 'высота&nbsp;', sub: 'см.&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'wide', label: 'ширина&nbsp;', sub: 'см.&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'depth', label: 'глубина&nbsp;', sub: 'см.&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'vol', label: 'объём &nbsp;', sub: 'л.&nbsp;&nbsp;&nbsp;', hold: 'введите значение' }
];
function draw_speaker(target) {
    clear(target);
    const form = appender({ tag: 'form', id: 'form', to: target });
    form.onsubmit = (e) => e.preventDefault();
    // Генерируем инпуты
    gen(speakerFields, {
        tag: 'input',
        to: form,
        className: 'inputs spk',
        content: 'decimal',
        // Сделать! вызов рассчета принимая ОДНО значение
        oninput: (e) => oneOpCalculation(e.target.id)
    });
    // СОЗДАЕМ КОНТЕЙНЕР ДЛЯ КНОПОК
    const btnBox = appender({ tag: 'div', className: 'btn-container', to: form });
    // КНОПКИ КЛАДЕМ ИМЕННО В btnBox
    appender({
        tag: 'button',
        content: 'С Б Р О С',
        to: btnBox, // <--- Важно!
        className: 'inputs',
        id: 'sbros',
        onclick: () => switchScreen('Корпус А.С.')
    });
    appender({
        tag: 'p',
        to: form,
        content: 'Расчёт корпуса аудио колонки. Достаточно ввести один любой параметр, чтобы получить результат , основанный на принципе "золотого сечения" - 1 к 1.62',
        //className: 'explanation',
        id: 'explanation',
    });
    for (all of document.querySelectorAll('option')) { all.className = 'body_spk'; }
}


const KDPFields = [
    { id: 'length', label: 'длина&nbsp;&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'width', label: 'ширина&nbsp;', hold: 'введите значение' },
    { id: 'height', label: 'высота&nbsp;', hold: 'введите значение' }, //error_fill
    { id: 'square', label: 'площадь&nbsp;', hold: 'введите значение' }
];
function draw_KDP(target) {
    clear(target);
    const form = appender({ tag: 'form', id: 'form', to: target });
    form.onsubmit = (e) => e.preventDefault();
    // Генерируем инпуты
    gen(KDPFields, {
        tag: 'input',
        to: form,
        className: 'inputs kdp',
        content: 'decimal',
        // Сделать! вызов рассчета принимая ОДНО значение
        oninput: (e) => oneOpCalculation(e.target.id)
    });
    // СОЗДАЕМ КОНТЕЙНЕР ДЛЯ КНОПОК
    const btnBox = appender({ tag: 'div', className: 'btn-container', to: form });
    // КНОПКИ КЛАДЕМ ИМЕННО В btnBox
    appender({//-----------------------------
        tag: 'button',
        content: 'ТВОЯ КОМНАТА',
        to: btnBox, // <--- Важно!
        className: 'inputs',
        id: 'sbros',
        onclick: () => draw_roomTest('#app_content'),
    });//-------------------------------------
    appender({
        tag: 'button',
        content: 'С Б Р О С',
        to: btnBox, // <--- Важно!
        className: 'inputs',
        id: 'sbros',
        onclick: () => switchScreen('К. Д. П.')
    });
    appender({
        tag: 'p',
        to: form,
        content: 'Расчёт размеров Комнаты Для Прослушивания музыки. Достаточно ввести один любой параметр, чтобы получить результат , основанный на принципе "золотого сечения" - 1 к 1.62',
        id: 'explanation',
    });
    for (all of document.querySelectorAll('option')) { all.className = 'body_kdp'; }
}



// branch for KDP - проверка пригодности готовой комнаты
const roomTestFields = [
    { id: 'height_test', label: 'высота', hold: 'введите значение' },
    { id: 'width_test', label: 'ширина', hold: 'введите значение' },
    { id: 'length_test', label: 'длина&nbsp;', hold: ' введите значение' },
];
function draw_roomTest(target) {
    clear(target);
    const form = appender({ tag: 'form', id: 'form', to: target });
    form.onsubmit = (e) => e.preventDefault();
    // Генерируем инпуты
    gen(roomTestFields, {
        tag: 'input',
        to: form,
        className: 'inputs kdp',
        content: 'decimal',
        // Сделать! вызов рассчета принимая ОДНО значение
        oninput: (e) => oneOpCalculation(e.target.id)
    });
    appender({
        tag: 'canvas',
        to: form,
        id: 'disp',
    });
    appender({
        tag: 'p',
        to: form,
        content: 'Оценка готовых помещений на пригодность к прослушиванию музыки.<br> Попал в Зелёный - хорошо. Мимо - не годится.',
        id: 'explanation',
    });
    drawPreciseBoltGraph();
    for (all of document.querySelectorAll('option')) { all.className = 'body_kdp'; }
}





setTimeout(function () {
    const sel = document.getElementById('nav');
    if (sel) {
        // Легкая "встряска" элемента для пересчета высоты
        sel.style.display = '';
        sel.style.display = 'flex';
    }
}, 10);




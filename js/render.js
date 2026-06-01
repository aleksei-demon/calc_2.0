
/*
RENDER.JS - отрисовка экранов

================================================================================
📗 ДОКУМЕНТАЦИЯ APRENDER.JS (v3.0 — 2026)
================================================================================

Порядок подключения: 
1. aprender.js (библиотека: h, factory, clear)
2. utils.js    (форматирование, работа со строками)
3. api.js      (async/fetch — связь с сервером)
4. logic.js    (массивы данных и математические формулы)
5. render.js   (чертежи компонентов и отрисовка экранов)

--------------------------------------------------------------------------------
1. ФУНКЦИЯ h (Hyperscript) — Атомарное создание элементов
--------------------------------------------------------------------------------
Синтаксис: h('tag#id.class', { props }, [ children ])

Параметры:
- sel (string):  Селектор. Примеры: 'div', 'button#btn', 'span.red.bold'
- obj (object):  Свойства (innerText, style, attr: {}, события on...)
- children (any): Строка, число или массив других вызовов h()

Пример: 
h('div.container', { style: { color: 'green' } }, 'Привет, Числобог!')

--------------------------------------------------------------------------------
2. ФУНКЦИЯ factory — Конвейерная сборка блоков по чертежу
--------------------------------------------------------------------------------
Синтаксис: factory(dataArray, blueprint)

Параметры:
- dataArray (Array): Массив объектов с данными (напр. speakerFields)
- blueprint (Function): Функция-чертеж. Принимает (item), возвращает h()

Пример (Чертеж в render.js):
const myBlueprint = (item) => h('label', {}, [ 
    item.label, 
    h('input', { id: item.id }) 
]);
const fields = factory(myArray, myBlueprint);

--------------------------------------------------------------------------------
3. ФУНКЦИЯ clear — Безопасная очистка узлов
--------------------------------------------------------------------------------
Синтаксис: clear('#id') или clear() для полной очистки body.
================================================================================
*/
window.addEventListener('pageshow', (event) => {
    // Если страница загружена из кэша или просто открыта заново
    if (event.persisted || performance.navigation.type === 2) {
        // Принудительно рендерим главный экран (Числобог)
        switchScreen('ЧИСЛОБОГ');
    }
});

// Названия разделов (теперь это просто массив данных)

window.addEventListener('resize', () => {
    if (document.getElementById('disp')) drawPreciseBoltGraph();
});

const nav_configs = [
    { label: '&nbsp;ЧИСЛОБОГ', value: 'ЧИСЛОБОГ' },
    { label: '&nbsp;закон Ома', value: 'закон Ома' },
    { label: '&nbsp;&nbsp;Т. В. З.', value: 'Т. В. З.' },
    { label: '&nbsp;&nbsp;К. Д. П.', value: 'К. Д. П.' },
    { label: '&nbsp;генератор', value: 'генератор', selected: true },
    { label: '&nbsp;Корпус А.С.', value: 'Корпус А.С.' },
];



function draw_init() {
    clear(''); // Полная зачистка
    document.body.classList.add('body_calc');
    const startScreen = nav_configs.find(item => item.selected)?.value || nav_configs[0].value;
    const options = nav_configs.map(item =>
        h('option.body_calc', {
            value: item.value,
            attr: {
                // Теперь это принудительно запишется в HTML как <option selected="selected">
                selected: (item.value === startScreen) ? 'selected' : null
            },
            innerHTML: item.label,
        })
    );
    const header = h('header#header', {}, [
        h('form#form2', { onsubmit: e => e.preventDefault() }, [
            h('select#nav.select', {
                onchange: (e) => { switchScreen(e.target.value); }
            }, options),
        ])
    ]);
    const main = h('main#app_content'); // Создаем базу для контента
    document.body.append(header, main); // Добавляем всё разом
    switchScreen(startScreen);
}


function switchScreen(name) {
    inputQueue = []; // Обнуляем очередь при каждом переходе    
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
        "ЧИСЛОБОГ": "body_calc",
        "генератор": "body_sine",
    };
    document.body.className = themes[name] || 'body_calc';
    // Вызов отрисовки конкретного контента
    if (name === "закон Ома") draw_ohm('#app_content');
    if (name === "Т. В. З.") draw_TVZ('#app_content');
    if (name === "К. Д. П.") draw_KDP('#app_content');
    if (name === "генератор") draw_sine('#app_content');
    if (name === "Корпус А.С.") draw_speaker('#app_content');
    if (name === "ЧИСЛОБОГ") draw_calc('#app_content');
    updateFavicon();
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

    // ЗАЩИТА: если таргет не найден, выходим, чтобы не плодить ошибки в консоли
    if (!targetEl) {
        console.warn('Target element not found:', target);
        return;
    }
    for (all of document.querySelectorAll('option')) { all.className = 'body_calc'; }

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
        h('input#op1.inputs.user_fill', {
            placeholder: ' A',
            attr: { inputmode: 'decimal', autocomplete: 'off' },
            oninput: (e) => oneOpCalculation(e.target.id),
            ondblclick: (e) => event_dblclick(e.target.id),
        }),

        // ВАЖНО: Селект создается сразу с детьми!
        h('select#dey.select', { onchange: (e) => runCalculator(e.target.id) }, options),

        h('input#op2.inputs.user_fill', {
            placeholder: ' Б',
            attr: { inputmode: 'decimal', autocomplete: 'off' },
            oninput: (e) => oneOpCalculation(e.target.id),
            ondblclick: (e) => event_dblclick(e.target.id),
        }),
        h('input#otvet.inputs.result_fill', { placeholder: ' ответ', readOnly: true, attr: { autocomplete: 'off' }, onclick: (e) => put_to_RAM(e.target.id) }),

        h('div.btn-container', {}, [
            h('button#sbros.inputs', { innerText: 'С Б Р О С', onclick: () => switchScreen('ЧИСЛОБОГ') })
        ]),

        h('p.explanation', { innerHTML: 'Даблклик на поле ввода даст число π, следующий число е, а третий 1/2π <br><br><br> Клик на поле "Ответ" скопирует его в буфер обмена' })
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
    for (all of document.querySelectorAll('option')) { all.className = 'body_ohms'; }
    const targetEl = document.querySelector(target);
    clear(target);
    // 1. Описываем ЧЕРТЕЖ прямо здесь
    const ohmBlueprint = (item) => h('label#' + item.id + '_', { className: 'ohm-label', innerHTML: item.label }, [
        item.sub ? h('sub', { innerHTML: item.sub }) : null, // Саб, если есть
        h('input.inputs.ohm', {
            id: item.id,
            placeholder: item.hold,
            attr: { inputmode: 'decimal' },
            oninput: (e) => handleOnInput(e.target.id) // Своя логика!
        })
    ]);
    // 2. Запускаем ЗАВОД
    const fields = factory(ohmFields, ohmBlueprint);
    // 3. Выводим результат
    targetEl.append(h('form.ohm-form', {}, fields));

    const bottomForm = h('form#ohm-form', { onsubmit: e => e.preventDefault() }, [
        h('button#sbros', { className: 'inputs', innerText: 'С Б Р О С', onclick: () => switchScreen('закон Ома') }),
        h('p.explanation', { innerText: 'Введите любую пару параметров.' })
    ]);
    targetEl.append(bottomForm);
}


const TVZFields = [
    { id: 'ktr_', label: 'К.', sub: 'тр.&nbsp;&nbsp;&nbsp;&nbsp;', hold: 'соотн. числа витков' },
    { id: 'loadR_', label: 'R', sub: 'нагр.&nbsp;&nbsp;', hold: 'R нагр. УНЧ., Ом' },
    { id: 'anodR_', label: 'R', sub: 'анод.&nbsp;', hold: 'R Анода, Ом' },
];
function draw_TVZ(target) {
    for (all of document.querySelectorAll('option')) { all.className = 'body_trans'; }
    const targetEl = document.querySelector(target);
    clear(target);
    // 1. Описываем ЧЕРТЕЖ прямо здесь
    const TVZBlueprint = (item) => h('label#' + item.id + '_', { className: 'TVZ-label', innerHTML: item.label }, [
        //item.label, // Просто текст
        item.sub ? h('sub', { innerHTML: item.sub }) : null, // Саб, если есть
        h('input.inputs.TVZ', {
            id: item.id,
            placeholder: item.hold,
            attr: { inputmode: 'decimal' },
            oninput: (e) => handleOnInput(e.target.id) // Своя логика!
        })
    ]);
    // 2. Запускаем ЗАВОД
    const fields = factory(TVZFields, TVZBlueprint);
    // 3. Выводим результат
    targetEl.append(h('form.TVZ-form', {}, fields));

    const bottomForm = h('form#TVZ-form', { onsubmit: e => e.preventDefault() }, [
        h('button#sbros', { className: 'inputs', innerText: 'С Б Р О С', onclick: () => switchScreen('Т. В. З.') }),
        h('p.explanation', { innerText: 'Расчёт приведённого сопротивления выходного трансформатора лампового УНЧ' })
    ]);
    targetEl.append(bottomForm);
}


const speakerFields = [
    { id: 'tall', label: 'высота&nbsp;', sub: 'см.&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'depth', label: 'ширина&nbsp;', sub: 'см.&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'wide', label: 'глубина&nbsp;', sub: 'см.&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'vol', label: 'объём &nbsp;', sub: 'л.&nbsp;&nbsp;&nbsp;', hold: 'введите значение' }
];
function draw_speaker(target) {
    for (all of document.querySelectorAll('option')) { all.className = 'body_spk'; }
    const targetEl = document.querySelector(target);
    clear(target);
    // 1. Описываем ЧЕРТЕЖ прямо здесь
    const speakerBlueprint = (item) => h('label#' + item.id + '_', { innerHTML: item.label }, [
        //item.label, // Просто текст
        item.sub ? h('sub', { innerHTML: item.sub }) : null, // Саб, если есть
        h('input.inputs.spk', {
            id: item.id,
            placeholder: item.hold,
            attr: { inputmode: 'decimal' },
            oninput: (e) => oneOpCalculation(e.target.id) // Своя логика!
        })
    ]);
    // 2. Запускаем ЗАВОД
    const fields = factory(speakerFields, speakerBlueprint);
    // 3. Выводим результат
    targetEl.append(h('form.speaker-form', {}, fields));

    const bottomForm = h('form#speaker-form', { onsubmit: e => e.preventDefault() }, [
        h('button#sbros', { className: 'inputs', innerText: 'С Б Р О С', onclick: () => switchScreen('Корпус А.С.') }),
        h('p.explanation', { innerText: 'Расчёт корпуса аудио колонки. Достаточно ввести один любой параметр, чтобы получить результат , основанный на принципе "золотого сечения" - 1 к 1.62' })
    ]);
    targetEl.append(bottomForm);
}


const KDPFields = [
    { id: 'KDP_length', label: 'длина&nbsp;&nbsp;&nbsp;', hold: 'введите значение' },
    { id: 'KDP_width', label: 'ширина&nbsp;', hold: 'введите значение' },
    { id: 'KDP_height', label: 'высота&nbsp;', hold: 'введите значение' }, //error_fill
    { id: 'KDP_square', label: 'площадь&nbsp;', hold: 'введите значение' }
];
const roomTestFields = [
    { id: 'height_test', label: 'высота&nbsp;', sub: 'м.', hold: 'введите значение' },
    { id: 'width_test', label: 'ширина&nbsp;', sub: 'м.', hold: 'введите значение' },
    { id: 'length_test', label: 'длина&nbsp;', sub: 'м.&nbsp;&nbsp;', hold: 'введите значение' },
];
const HelmholtzFields = [
    { id: 'Helmholtz_V', label: 'объём&nbsp;', sub: 'л.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;', hold: 'всего корпуса' },
    { id: 'Helmholtz_L', label: 'глубина&nbsp;', sub: 'мм.&nbsp;', hold: 'толщина доски' },
    { id: 'Helmholtz_W', label: 'ширина&nbsp;', sub: 'мм.&nbsp;&nbsp;', hold: 'щели порта' },
    { id: 'Helmholtz_H', label: 'высота&nbsp;', sub: 'мм.&nbsp;&nbsp;&nbsp;', hold: 'щели порта' },
    { id: 'Helmholtz_F', label: 'частота&nbsp;', sub: 'Hz&nbsp;', hold: 'настройки' },
];
function draw_KDP(target) {
    const targetEl = document.querySelector(target);
    clear(target);
    // Меняем тему для всех опций в хедер селект
    document.querySelectorAll('option').forEach(opt => opt.className = 'body_kdp');
    // 1. ЧЕРТЕЖ (Blueprint) — теперь он универсален
    const KDPBlueprint = (item) => h('label#' + item.id + '_', { innerHTML: item.label }, [
        item.sub ? h('sub', { innerHTML: item.sub }) : null, // Саб, если есть
        h('input.inputs.KDP', {
            id: item.id,
            placeholder: item.hold,
            attr: { inputmode: 'decimal' },
            oninput: (e) => oneOpCalculation(e.target.id)
        })
    ]);
    const HelmholtzBlueprint = (item) => h('label#' + item.id + '_', { innerHTML: item.label }, [
        item.sub ? h('sub', { innerHTML: item.sub }) : null,
        h('input.inputs.KDP', {
            id: item.id,
            placeholder: item.hold,
            attr: { inputmode: 'decimal' },
            // МЕНЯЕМ ОБРАБОТЧИК:
            oninput: (e) => helmholtzEngine(e.target.id)
        })
    ]);
    // СЕКЦИЯ 1: ИДЕАЛЬНАЯ КОМНАТА
    const fields = factory(KDPFields, KDPBlueprint);
    const kdpSection = h('form#KDP_form.form-block', { onsubmit: e => e.preventDefault() }, [
        h('h2.explanation', {}, 'ИДЕАЛЬНАЯ КОМНАТА <br> для прослушивания'),
        ...fields,
        h('div#room_viewport', {
            style: { width: '100%', maxWidth: '300px', margin: '0 auto' },
            innerHTML: generateRoomSVG2D(1.618, 2.618),
        }),
        h('button', {
            type: 'button',
            className: 'inputs sbros',
            innerText: 'С Б Р О С',
            onclick: (e) => {
                e.target.closest('form').reset();
                document.getElementById('room_viewport').innerHTML = generateRoomSVG2D(1.618, 2.618);
            }
        }),
    ]);

    // СЕКЦИЯ 2: ТЕСТ РЕАЛЬНОЙ КОМНАТЫ
    const testFieldsNodes = factory(roomTestFields, KDPBlueprint);
    const testSection = h('form#RoomTest_form.form-block', {}, [
        h('h2.explanation', {}, 'ТЕСТ КОМНАТЫ <br> на пригодность к аудио'),
        ...testFieldsNodes,
        // ЗАМЕНА CANVAS НА DIV:
        h('div#bolt_viewport', {
            style: { width: '100%', maxWidth: '300px', margin: '0 auto' },
            innerHTML: generateBoltGraphSVG()
        }),
        h('button', {
            type: 'button',
            className: 'inputs sbros',
            innerText: 'С Б Р О С',
            onclick: (e) => {
                e.target.closest('form').reset();
                document.getElementById('bolt_viewport').innerHTML = generateBoltGraphSVG();
            }
        }),
    ]);
    // 3. Резонатор
    const HelmholtzNodes = factory(HelmholtzFields, HelmholtzBlueprint);
    const HelmholtzSection = h('form#Helmholtz_form.form-block', {}, [
        h('h2.explanation', {}, 'Резонатор ГЕЛЬМГОЛЬЦА <br> Расчёт одной секции <br> (для подавления комнатных резонансов)'),
        ...HelmholtzNodes,
        h('button', { type: 'button', className: 'inputs sbros', innerText: 'С Б Р О С', onclick: (e) => e.target.closest('form').reset() }),
        h('p.explanation', {}, 'Одна секция Резонатора ГЕЛЬМГОЛЬЦА это глухой ящик который имеет одну щель, которую характеризует площадь и глубина (определяется толщиной доски) <br> Если некоторое количество секций собирают в одну батарею, то внутренние перегородки в ней необязательны.'),
    ]);
    // Добавляем всё в главный контейнер
    targetEl.append(testSection, kdpSection, HelmholtzSection);
}

const sineFields = [
    { id: 'mode', label: 'Розовый шум', attr: { type: 'checkbox' } },
    { id: 'freq_display', tag: 'output', label: 'частота&nbsp;&nbsp;', attr: { value: '0' } },
    { id: 'freq', label: 'F', sub: 'Hz&nbsp;&nbsp;', type: 'range', attr: { type: 'range', min: '5', max: '300', value: '50', step: '1' }, },
    { id: 'amplitude', label: 'amp&nbsp;', attr: { type: 'range', min: '0', max: '100', value: '50', step: '1' }, },
];
function draw_sine(target) {
    for (all of document.querySelectorAll('option')) { all.className = 'body_sine'; }
    const targetEl = document.querySelector(target);
    clear(target);

    const sineBlueprint = (item) => {
        // 1. Определяем, является ли это слайдером
        const isRange = item.attr && item.attr.type === 'range';

        // 2. Определяем тег (по умолчанию input)
        const tagName = item.tag || 'input';

        // 3. Формируем классы динамически: 
        // добавляем .custom-slider ТОЛЬКО если это range
        const classes = `.inputs.sine${isRange ? '.custom-slider' : ''}`;
        const selector = `${tagName}${classes}`;

        // 4. Формируем ID для лейбла (безопасно)
        const labelSelector = `label#${item.id}_.labeOfGen`;

        return h(labelSelector, { innerHTML: item.label }, [
            item.sub ? h('sub', { innerHTML: item.sub }) : null,

            // 5. Создаем элемент с нужным селектором
            h(selector, {
                id: item.id,
                attr: item.attr || {},
                oninput: (e) => sineEngine(e.target.id)
            })
        ]);
    };

    const sineNodes = factory(sineFields, sineBlueprint);
    const sineForm = h('form#sine-form', { onsubmit: e => e.preventDefault() }, [

        ...sineNodes,// <--- ВОТ ЗДЕСЬ МАГИЯ (распаковка массива)
        h('button#sbros', { className: 'inputs', innerText: 'П У С К', onclick: () => sineSwith() }),
        h('p.explanation', { innerHTML: '- тон перестраиваемый по частоте для поиска резонансов <br> <br> -  Розовый шум: имеет наклон -3дб/окт, что обеспечивает в каждой октаве абсолютно одинаковое количество энергии, предназначен для оценики линейности АЧХ' })
    ]);
    targetEl.append(sineForm);
}

//-------------------------------------------------------------------
setTimeout(function () {
    const sel = document.getElementById('nav');
    if (sel) {
        // Легкая "встряска" элемента для пересчета высоты
        sel.style.display = '';
        sel.style.display = 'flex';
    }
}, 10);

// 3. И в самом низу — запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    switchScreen('ЧИСЛОБОГ');
});

// И тут же рядом фикс для мобильного кэша (Pageshow)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        switchScreen('ЧИСЛОБОГ');
    }
});


function updateFavicon() {
    const bodyClass = document.body.className;
    let iconContent = '';

    // Отрисовка геометрии для каждой темы
    switch (bodyClass) {
        case 'body_sine': // Генератор синуса (синусоида)
            iconContent = `
            <path d="M 10 50 C 25 10, 35 10, 50 50 S 75 90, 90 50" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>`;
            break;
        case 'body_ohms': // Закон Ома (символ круга разделенного на U, I, R)
            iconContent = `
            <path d="M 20 80 H 38 A 25 25 0 1 1 62 80 H 80"  fill="none" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>`;
            break;
        case 'body_trans': // Т.В.З. (символ катушек трансформатора)
            iconContent = `
            /* Левая обмотка (первичная) */
            <path d="M30 20 A 10 11.5 0 1 0 30 43 A 10 11.5 0 1 0 30 66 A 10 11.5 0 1 0 30 89" 
                  fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
            /* Сердечник */
            <line x1="50" y1="20" x2="50" y2="80" 
                  stroke="currentColor" stroke-width="6" stroke-dasharray="8,8"/>
            /* Правая обмотка (вторичная) */
            <path d="M70 20 A 10 11.5 0 1 1 70 43 A 10 11.5 0 1 1 70 66 A 10 11.5 0 1 1 70 89" 
                  fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`;
            break;
        case 'body_kdp': // К.Д.П. (золотое сечение / пропорции комнаты)
            iconContent = `
                <rect x="15" y="25" width="70" height="50" fill="none" stroke="currentColor" stroke-width="8"/>
                <path d="M15 75 Q 85 75, 85 25" fill="none" stroke="currentColor" stroke-width="5" opacity="0.7"/>`;
            break;
        case 'body_spk': // Корпус А.С. (динамик в ящике)
            iconContent = `
                <rect x="25" y="10" width="50" height="80" rx="5" fill="none" stroke="currentColor" stroke-width="8"/>
                <circle cx="50" cy="65" r="15" fill="none" stroke="currentColor" stroke-width="6"/>
                <circle cx="50" cy="30" r="8" fill="none" stroke="currentColor" stroke-width="4"/>`;
            break;
        default: // ЧИСЛОБОГ (сетка кнопок калькулятора)
            iconContent = `
                <rect x="20" y="20" width="22" height="22" rx="3" fill="currentColor"/>
                <rect x="58" y="20" width="22" height="22" rx="3" fill="currentColor"/>
                <rect x="20" y="58" width="22" height="22" rx="3" fill="currentColor"/>
                <rect x="58" y="58" width="22" height="22" rx="3" fill="currentColor"/>`;
    }
    // Формируем SVG с CSS-медиазапросом для автоматической инверсии
    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <style>
            svg { color: #1a1a1a; } /* Цвет для светлой темы */
            @media (prefers-color-scheme: dark) {
                svg { color: #f0f0f0; } /* Цвет для темной темы */
            }
        </style>
        ${iconContent}
    </svg>`;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        document.head.appendChild(link);
    }
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svgIcon);
}


const screenOrder = ["ЧИСЛОБОГ", "закон Ома", "Т. В. З.", "К. Д. П.", 'генератор', "Корпус А.С."];

/**
 * Переключает на следующий или предыдущий экран
 * @param {number} direction - 1 для свайпа влево (вперед), -1 для свайпа вправо (назад)
 */
function swipeScreen(direction) {
    const menu = document.getElementById('nav');
    if (!menu) return;

    // Очищаем имя от возможных лишних пробелов по краям
    const currentName = menu.selectedOptions[0].text.trim();

    // Ищем индекс
    let currentIndex = screenOrder.indexOf(currentName);

    // ЕСЛИ ИМЯ НЕ НАЙДЕНО (возвращает -1)
    // Это и есть причина, по которой "не идет по кругу"
    if (currentIndex === -1) {
        // Попробуем найти индекс через частичное совпадение, если точное не сработало
        currentIndex = screenOrder.findIndex(name => name.includes(currentName) || currentName.includes(name));
    }

    // Если всё равно не нашли — выходим, чтобы не сломать расчеты
    if (currentIndex === -1) {
        console.error("Экран не найден в списке:", currentName);
        return;
    }

    let nextIndex = (currentIndex + direction + screenOrder.length) % screenOrder.length;

    switchScreen(screenOrder[nextIndex]);
}


let touchStartX = 0;
let touchStartY = 0; // Добавим Y для проверки на вертикальный скролл

document.addEventListener('touchstart', e => {
    // Игнорируем ввод в поля
    if (e.target.closest('input, select, textarea, button')) return;

    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (touchStartX === 0) return; // Если начали свайп на инпуте, ничего не делаем

    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const dx = touchStartX - touchEndX;
    const dy = touchStartY - touchEndY;

    // Проверка: горизонтальный сдвиг должен быть больше вертикального
    // Чтобы случайный наклон при скролле не переключал экраны
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx > 0) {
            swipeScreen(1);  // Свайп влево -> вперед
        } else {
            swipeScreen(-1); // Свайп вправо -> назад
        }
    }

    // Сброс координат
    touchStartX = 0;
    touchStartY = 0;
}, { passive: true });



/*
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

if (true) { //start

    let body = document.querySelector('body');

    /**
     * Создает элемент с атрибутами, событиями и дочерними элементами.
     * @param {string} sel - Тег (например 'div' или 'select#dey.select')
     * @param {object} obj - Атрибуты и события
     * @param {Array|string} children - Дочерние элементы
     */
    function h(sel, obj = {}, children = []) {
        // 1. Извлекаем тег (все что до первого # или .)
        const tag = sel.split(/[#.]/)[0] || 'div';
        const el = document.createElement(tag);
        // 2. Извлекаем ID (все что после # до следующей точки или конца)
        const idMatch = sel.match(/#([^.]+)/);
        if (idMatch) el.id = idMatch[1];
        // 3. Извлекаем КЛАССЫ (все что после точек, игнорируя то что после #)
        const classes = sel.split('.').slice(1); // Берем всё после первой точки
        if (classes.length > 0) {
            // Убираем возможный ID из хвоста первого класса, если он там затесался
            el.className = classes.map(c => c.split('#')[0]).join(' ');
        }
        for (const key in obj) {
            if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), obj[key]);
            } else if (key === 'style' && typeof obj[key] === 'object') {
                Object.assign(el.style, obj[key]);
            } else if (key === 'attr') {
                for (const a in obj[key]) el.setAttribute(a, obj[key][a]);
            } else {
                el[key] = obj[key];
            }
        }
        // Улучшение: поддержка чисел в детях (например, результат расчета)
        if (typeof children === 'string' || typeof children === 'number') {
            el.innerHTML = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (child) el.append(child);
            });
        }
        return el;
    }


    /**
     * FACTORY: Превращает массив данных в массив DOM-узлов
     * @param {Array} data - Твой массив (например, speakerFields)
     * @param {Function} blueprint - Функция-чертеж, которая возвращает h()
     */
    function factory(data, blueprint) {
        return data.map((item, index) => blueprint(item, index));
    }


    function clear(node = '') {
        if (node == '') { body.innerHTML = ``; return; }
        document.querySelector(node).innerHTML = ``;
    }


} //end


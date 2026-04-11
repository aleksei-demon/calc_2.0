
/*
================================================================================
📗 ДОКУМЕНТАЦИЯ APRENDER.JS (v2.0 — 2026)
================================================================================

Порядок подключения: 
1. appender.js (библиотека)
2. utils.js (Инструменты: запятые, точки, классы)
3. api.js (Связь с миром: Fetch, Async функции) — НОВОЕ
4. logic.js (формулы и расчеты)
5. render.js (верстка)

 * ФУНКЦИЯ h (Hyperscript) — создание DOM-элементов
 * * Синтаксис: h('tag#id.class', { props }, [ children ])
 * * @param {string} sel - Строка селектора: 'div', 'button#btn', 'span.red.bold'
 * @param {object} obj - Свойства: { innerText: 'Ок', onclick: fn, style: { color: 'red' } }
 * @param {Array|string} children - Текст или массив вложенных вызовов h()
 * * ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
 * 1. Простой текст: h('p', { className: 'hint' }, 'Введите число')
 * 2. Кнопка с событием: h('button#reset', { onclick: () => alert(1) }, 'Сброс')
 * 3. Вложенность: 
 * h('div.box', { style: { display: 'flex' } }, [
 * h('span', {}, 'Цена: '),
 * h('b', { innerText: '100 руб' })
 * ])
 * 4. Списки (через map):
 * h('select', { onchange: myFn }, items.map(i => h('option', { value: i }, i)))
 */



if (true) { //start

    let body = document.querySelector('body');

    function appender(params = {}) { // Теперь все настройки живут в params
        // 1. Вытаскиваем значения из params, задавая дефолты
        const {
            tag = 'div',
            to = 'body',
            hold = '',
            content = '',
            className = '',
            id = '',
            attr = {}
        } = params;
        const item = document.createElement(tag);
        if (id) item.id = id;
        if (className) item.className = className;
        // Позволяем передавать объект стилей: style: { color: 'red', marginTop: '10px' }
        if (params.style && typeof params.style === 'object') {
            Object.assign(item.style, params.style);
        }
        if (content !== '') {
            if (tag === 'input') { item.setAttribute('inputmode', content); }
            else if (tag === 'form') { item.setAttribute('action', content); }
            else { item.innerHTML = content; }
        }
        if (hold) {
            const holdMap = {
                input: 'placeholder', ol: 'type', abbr: 'title', img: 'src', a: 'href'
            };
            const attrName = holdMap[tag] || 'title';
            item.setAttribute(attrName, hold);
        }
        Object.entries(attr).forEach(([key, value]) => item.setAttribute(key, value));
        let parent;
        if (to instanceof HTMLElement) {
            parent = to; // Если передали уже готовый элемент
        } else {
            parent = to === 'body' ? document.body : document.querySelector(to);
        }
        if (parent) parent.append(item);
        // 2. ИСПРАВЛЕНИЕ ОШИБКИ: Проверяем события в объекте params
        const events = ['oninput', 'onclick', 'onchange', 'ondblclick'];
        events.forEach(eventName => {
            if (params[eventName]) { // <--- Теперь смотрим в params, а не в config
                const type = eventName.replace('on', '');
                item.addEventListener(type, params[eventName]);
            }
        });
        return item;
    }

    function gen(data, commonParams = {}) {
        const elements = [];
        // Если передали число - работаем как раньше (клонируем)
        if (typeof data === 'number') {
            for (let i = 0; i < data; i++) {
                const config = { ...commonParams };
                if (commonParams.id) config.id = `${commonParams.id}_${i}`;
                elements.push(appender(config));
            }
        }
        // А если передали МАССИВ - создаем разные элементы по списку!
        else if (Array.isArray(data)) {
            data.forEach(itemConfig => {
                const finalConfig = { ...commonParams, ...itemConfig };
                //если в конфиге есть sub, мы создаем его сразу после основного
                // текста лейбла, но перед инпутом.
                if (finalConfig.label) {
                    // 1. Создаем ЛЕЙБЛ точно как в твоем старом проекте
                    const wrapper = appender({
                        tag: 'label',
                        id: finalConfig.id + '_label', // Если нужно для стилей
                        content: finalConfig.label,    // Вставляет "u&nbsp;"
                        to: finalConfig.to             // Идет в форму
                    });
                    if (finalConfig.sub) {
                        appender({
                            tag: 'sub',
                            // id: '',
                            content: finalConfig.sub,
                            to: wrapper,
                        });
                    }
                    // 2. Вставляем ИНПУТ внутрь этого лейбла
                    const inputConfig = { ...finalConfig, to: wrapper };
                    delete inputConfig.label; // Чтобы не уйти в рекурсию

                    elements.push(appender(inputConfig));
                } else {
                    elements.push(appender(finalConfig));
                }
            });
        }
        return elements;
    }




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







    function clear(node = '') {
        if (node == '') { body.innerHTML = ``; return; }
        document.querySelector(node).innerHTML = ``;
    }


    //---  dynamic adaptive  -------

    function setupAdaptive() {
        const observer = new ResizeObserver(() => {
            // Твои вызовы адаптива
            adaptive('.ee', 5, 50, 5, 50);
            adaptive('#canvas', 25, 25, 30, 30);
            console.log('Размер изменился, адаптируем...');
        });

        observer.observe(document.documentElement);
    }

} //end


// =============================================================================
// UTILS.JS — Сервисные функции
// =============================================================================

/**
 * Исправляет запятые на точки и фильтрует лишние символы
 */
function comma_point_correct(val) {
    if (typeof val !== 'string') return val;
    // Заменяем запятую на точку
    let corrected = val.replace(',', '.');
    // Оставляем только цифры, одну точку и минус в начале
    // Это более современный способ через регулярные выражения
    corrected = corrected.replace(/[^\d.-]/g, '');
    // Проверка на вторую точку (оставляем только первую)
    const parts = corrected.split('.');
    if (parts.length > 2) {
        corrected = parts[0] + '.' + parts.slice(1).join('');
    }
    return corrected;
}

/**
 * Переключает классы оформления для инпутов (ввод пользователя vs результат)
 */
function toggle_input_cssClass(elem, isResult = false) {
    if (!elem) return;
    // Сначала очищаем от "грязных" данных через наш корректор
    elem.value = comma_point_correct(elem.value);
    if (isResult) {
        elem.classList.remove('user_fill');
        elem.classList.add('result_fill');
    } else {
        elem.classList.remove('result_fill');
        elem.classList.add('user_fill');
    }
}

function put_to_RAM(id) {
    const element = document.getElementById(id);
    navigator.clipboard.writeText(element.value)
}


function event_dblclick(id) {
    const el = document.getElementById(id);
    if (!el) return;
    // Список констант для перебора
    const constants = [
        Math.PI.toFixed(9),
        Math.E.toFixed(9),
        (Math.PI / 2).toFixed(9)
    ];
    // Получаем текущий индекс из атрибута data-revolve (или 0, если его нет)
    let index = parseInt(el.dataset.revolve) || 0;
    // Устанавливаем значение
    el.value = constants[index % constants.length];
    // Запускаем пересчет
    if (typeof oneOpCalculation === 'function') { oneOpCalculation(id); }
    // Сохраняем следующий индекс обратно в элемент
    el.dataset.revolve = index + 1;
}




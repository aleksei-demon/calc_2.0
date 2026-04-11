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

function put_to_RAM() {
    navigator.clipboard.writeText(otvet.value)
        .then(() => {
            // Получилось!
            document.querySelector('#massage').innerText = 'Скопировано в буфер обмена';
            setTimeout(() => { document.querySelector('#massage').innerText = ''; }, 2200);
        })
        .catch(err => {
            console.log('Something went wrong', err);
        });
}

function fill_select_options(where_to_get, option_id) {
    for (let i = 0; i < where_to_get.length; i++) {
        let option = document.querySelector(`#${option_id}${i}`);
        option.setAttribute('value', where_to_get[i]);
        option.innerHTML = where_to_get[i];
    }
}



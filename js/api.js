/* =============================================================================
// API.JS — Работа с внешними данными
// Важный момент: 
Помни, что async функции возвращают промисы. 
Это значит, что в render.js тебе нужно будет использовать.then() или 
тоже делать функцию отрисовки асинхронной:

async function draw_tasks_screen() {
    clear('#form');
    appender({ tag: 'p', content: 'Загрузка данных...' });

    const data = await fetchTasks(); // Ждем данные из api.js
    
    clear('#form');
    if (data) {
        // Генерируем список задач через наш новый gen()!
        gen(data.slice(0, 5), { tag: 'div', className: 'task-item' });
    }
}
 =============================================================================
*/
async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка сети');

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Не удалось загрузить данные:", error);
        return null;
    }
}

// Пример функции для твоего виджета задач (jsonplaceholder)
async function fetchTasks() {
    const tasks = await getData('https://jsonplaceholder.typicode.com/todos');
    if (tasks) {
        // Здесь мы можем либо сразу вызвать Render, либо вернуть данные в Logic
        return tasks;
    }
}
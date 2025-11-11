// DOM elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');
const bgEffects = document.getElementById('bgEffects');
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const completedTasksEl = document.getElementById('completedTasks');
const clearAllSection = document.getElementById('clearAllSection');
const clearAllBtn = document.getElementById('clearAllBtn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editTaskId = null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initBackgroundEffects();
    renderTasks();
    updateStats();
    updateClearAll();
});

// background particles (keeps the same effect)
function initBackgroundEffects() {
    for (let i = 0; i < 18; i++) createParticle();
}
function createParticle() {
    const p = document.createElement('div');
    p.className = 'bg-particle';
    const s = Math.random() * 80 + 40;
    p.style.width = p.style.height = `${s}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 20}s`;
    p.style.animationDuration = `${Math.random() * 25 + 18}s`;
    bgEffects.appendChild(p);
    // recycle after some time
    setTimeout(() => {
        if (p.parentNode) p.remove();
        // create a replacement so background stays full
        setTimeout(createParticle, 2000);
    }, 45000);
}

// theme
function initTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark');
        toggleThemeIcons();
    }
}
function toggleThemeIcons() {
    const l = themeToggle.querySelector('.light-icon');
    const d = themeToggle.querySelector('.dark-icon');
    if (!l || !d) return;
    l.style.display = document.body.classList.contains('dark') ? 'none' : 'block';
    d.style.display = document.body.classList.contains('dark') ? 'block' : 'none';
}
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDarkMode);
    toggleThemeIcons();
});

// add task
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });

function addTask() {
    const txt = taskInput.value.trim();
    if (!txt) return;

    if (editTaskId) {
        const t = tasks.find(x => x.id === editTaskId);
        if (t) t.text = txt;
        editTaskId = null;
    } else {
        tasks.push({ id: Date.now().toString(), text: txt, completed: false });
    }
    saveTasks();
    taskInput.value = '';
    renderTasks();
}

// event delegation for list (handles check, edit, delete reliably)
taskList.addEventListener('click', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = li.dataset.id;
    // checkbox (may be the input or an element inside label)
    if (e.target.matches('.task-checkbox')) {
        toggleComplete(id);
        return;
    }
    // edit
    if (e.target.matches('.edit-btn') || e.target.closest('.edit-btn')) {
        editTask(id);
        return;
    }
    // delete
    if (e.target.matches('.delete-btn') || e.target.closest('.delete-btn')) {
        deleteTask(id);
        return;
    }
});

// edit helper
function editTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    editTaskId = id;
    taskInput.value = t.text;
    taskInput.focus();
}

// toggle complete
function toggleComplete(id) {
    const t = tasks.find(x => x.id === id);
    if (t) t.completed = !t.completed;
    saveTasks();
    renderTasks();
}

// delete
function deleteTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if (confirm('Delete this task forever?')) {
        tasks = tasks.filter(x => x.id !== id);
        saveTasks();
        renderTasks();
    }
}

// clear all / nuke
clearAllBtn.addEventListener('click', () => {
    if (!tasks.length) return;
    if (confirm('NUKE ALL TASKS? This is permanent!')) {
        tasks = [];
        saveTasks();
        renderTasks();
    }
});

// persist
function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

// rendering
function renderTasks() {
    taskList.innerHTML = '';
    const filter = document.querySelector('.filter-btn.active').dataset.filter;
    const filtered = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    filtered.forEach((t, i) => {
        const li = document.createElement('li');
        li.className = `task-item ${t.completed ? 'completed' : ''}`;
        li.dataset.id = t.id;
        li.style.animationDelay = `${i * 0.06}s`;

        // build inside DOM (avoid fragile innerHTML event timing issues)
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        if (t.completed) checkbox.checked = true;

        const content = document.createElement('div');
        content.className = 'task-content';
        const textDiv = document.createElement('div');
        textDiv.className = 'task-text';
        textDiv.innerHTML = escapeHtml(t.text);
        content.appendChild(textDiv);

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.title = 'Edit';
        // use icon + label
        editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(actions);

        taskList.appendChild(li);
    });

    updateEmptyState();
    updateStats();
    updateClearAll();
}

// helpers
function updateEmptyState() {
    emptyState.style.display = taskList.children.length > 0 ? 'none' : 'block';
}
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    totalTasksEl.textContent = total;
    activeTasksEl.textContent = total - completed;
    completedTasksEl.textContent = completed;
}
function updateClearAll() { clearAllSection.style.display = tasks.length > 0 ? 'block' : 'none'; }

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

// filters
filterBtns.forEach(b => {
    b.addEventListener('click', () => {
        filterBtns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderTasks();
    });
});

// keyboard shortcuts: Ctrl/Cmd + D -> toggle theme, Ctrl/Cmd + K -> focus input
document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'd') { e.preventDefault(); themeToggle.click(); }
        if (e.key === 'k') { e.preventDefault(); taskInput.focus(); }
    }
});

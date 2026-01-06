class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';

        this.elements = {
            taskInput: document.getElementById('taskInput'),
            prioritySelect: document.getElementById('prioritySelect'),
            dueDateInput: document.getElementById('dueDateInput'),
            searchInput: document.getElementById('searchInput'),
            addBtn: document.getElementById('addBtn'),
            taskList: document.getElementById('taskList'),
            taskCount: document.getElementById('taskCount'),
            statsDetail: document.getElementById('statsDetail'),
            clearBtn: document.getElementById('clearBtn'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            themeToggle: document.getElementById('themeToggle'),
        };

        this.init();
    }

    init() {
        this.applyTheme();

        this.elements.addBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.elements.clearBtn.addEventListener('click', () => this.clearCompleted());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.toLowerCase();
            this.render();
        });

        this.elements.filterBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.render();
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
        this.render();
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.elements.themeToggle.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            this.elements.themeToggle.textContent = '🌙';
        }
    }

    addTask() {
        const text = this.elements.taskInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text,
            description: '',
            priority: this.elements.prioritySelect.value,
            dueDate: this.elements.dueDateInput.value,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        this.todos.push(todo);
        this.elements.taskInput.value = '';
        this.elements.prioritySelect.value = 'medium';
        this.elements.dueDateInput.value = '';
        this.save();
        this.render();
    }

    deleteTask(id) {
        this.todos = this.todos.filter((todo) => todo.id !== id);
        this.save();
        this.render();
    }

    toggleTask(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.save();
            this.render();
        }
    }

    editTask(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (!todo) return;

        const newText = prompt('Edit task:', todo.text);
        if (newText !== null && newText.trim()) {
            todo.text = newText.trim();
            
            const newDesc = prompt('Add/edit description (optional):', todo.description || '');
            if (newDesc !== null) {
                todo.description = newDesc.trim();
            }

            this.save();
            this.render();
        }
    }

    clearCompleted() {
        this.todos = this.todos.filter((todo) => !todo.completed);
        this.save();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;

        this.elements.filterBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.render();
    }

    isOverdue(dueDate) {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    }

    getFilteredTodos() {
        let filtered = this.todos;

        // Apply search filter
        if (this.currentSearch) {
            filtered = filtered.filter((todo) =>
                todo.text.toLowerCase().includes(this.currentSearch) ||
                (todo.description && todo.description.toLowerCase().includes(this.currentSearch))
            );
        }

        // Apply status filter
        if (this.currentFilter === 'active') {
            filtered = filtered.filter((todo) => !todo.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter((todo) => todo.completed);
        } else if (this.currentFilter === 'overdue') {
            filtered = filtered.filter((todo) => !todo.completed && this.isOverdue(todo.dueDate));
        }

        // Sort by: overdue first, then by priority, then by creation date
        filtered.sort((a, b) => {
            const aOverdue = this.isOverdue(a.dueDate);
            const bOverdue = this.isOverdue(b.dueDate);

            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;

            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }

            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return filtered;
    }

    updateTaskCount() {
        const count = this.todos.length;
        const completedCount = this.todos.filter((t) => t.completed).length;
        const activeCount = count - completedCount;
        const overdueCount = this.todos.filter((t) => !t.completed && this.isOverdue(t.dueDate)).length;

        let text = `${count} ${count === 1 ? 'task' : 'tasks'}`;
        this.elements.taskCount.textContent = text;

        let detail = `${activeCount} active`;
        if (overdueCount > 0) {
            detail += ` • ${overdueCount} overdue`;
        }
        this.elements.statsDetail.textContent = detail;
    }

    render() {
        const filtered = this.getFilteredTodos();
        this.elements.taskList.innerHTML = '';

        if (filtered.length === 0) {
            const emptyMsg =
                this.currentSearch || this.currentFilter !== 'all'
                    ? 'No tasks found'
                    : 'No tasks yet. Add one to get started!';
            this.elements.taskList.innerHTML = `<div class="empty-state"><p>${emptyMsg}</p></div>`;
        } else {
            filtered.forEach((todo) => {
                const li = document.createElement('li');
                const isOverdue = this.isOverdue(todo.dueDate) && !todo.completed;
                li.className = `task-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;

                const dueDateStr = todo.dueDate ? `📅 ${this.formatDate(todo.dueDate)}` : '';
                const descriptionHtml = todo.description
                    ? `<div class="task-description">${this.escapeHtml(todo.description)}</div>`
                    : '';

                li.innerHTML = `
                    <input
                        type="checkbox"
                        class="task-checkbox"
                        ${todo.completed ? 'checked' : ''}
                        data-id="${todo.id}"
                    />
                    <div class="task-content">
                        <div class="task-header">
                            <span class="task-text">${this.escapeHtml(todo.text)}</span>
                            <span class="task-priority priority-${todo.priority}">${todo.priority}</span>
                        </div>
                        <div class="task-meta">
                            ${dueDateStr}
                        </div>
                        ${descriptionHtml}
                    </div>
                    <div class="task-actions">
                        <button class="task-btn edit-btn" data-id="${todo.id}">Edit</button>
                        <button class="task-btn delete-btn" data-id="${todo.id}">Delete</button>
                    </div>
                `;

                this.elements.taskList.appendChild(li);
            });
        }

        this.attachEventListeners();
        this.updateTaskCount();
    }

    attachEventListeners() {
        // Checkbox listeners
        document.querySelectorAll('.task-checkbox').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTask(parseInt(e.target.dataset.id));
            });
        });

        // Edit button listeners
        document.querySelectorAll('.edit-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.editTask(parseInt(e.target.dataset.id));
            });
        });

        // Delete button listeners
        document.querySelectorAll('.delete-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.deleteTask(parseInt(e.target.dataset.id));
            });
        });
    }

    save() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        }
        if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

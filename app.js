class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;

        this.elements = {
            taskInput: document.getElementById('taskInput'),
            addBtn: document.getElementById('addBtn'),
            taskList: document.getElementById('taskList'),
            taskCount: document.getElementById('taskCount'),
            clearBtn: document.getElementById('clearBtn'),
            filterBtns: document.querySelectorAll('.filter-btn'),
        };

        this.init();
    }

    init() {
        this.elements.addBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.elements.clearBtn.addEventListener('click', () => this.clearCompleted());

        this.elements.filterBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.render();
    }

    addTask() {
        const text = this.elements.taskInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text,
            completed: false,
        };

        this.todos.push(todo);
        this.elements.taskInput.value = '';
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

    getFilteredTodos() {
        if (this.currentFilter === 'active') {
            return this.todos.filter((todo) => !todo.completed);
        }
        if (this.currentFilter === 'completed') {
            return this.todos.filter((todo) => todo.completed);
        }
        return this.todos;
    }

    updateTaskCount() {
        const count = this.todos.length;
        const completedCount = this.todos.filter((t) => t.completed).length;
        let text = `${count} ${count === 1 ? 'task' : 'tasks'}`;
        if (completedCount > 0) {
            text += ` (${completedCount} completed)`;
        }
        this.elements.taskCount.textContent = text;
    }

    render() {
        const filtered = this.getFilteredTodos();
        this.elements.taskList.innerHTML = '';

        if (filtered.length === 0) {
            this.elements.taskList.innerHTML =
                '<div class="empty-state"><p>No tasks yet. Add one to get started!</p></div>';
        } else {
            filtered.forEach((todo) => {
                const li = document.createElement('li');
                li.className = `task-item ${todo.completed ? 'completed' : ''}`;

                li.innerHTML = `
                    <input
                        type="checkbox"
                        class="task-checkbox"
                        ${todo.completed ? 'checked' : ''}
                        data-id="${todo.id}"
                    />
                    <div class="task-content">
                        <span class="task-text">${this.escapeHtml(todo.text)}</span>
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

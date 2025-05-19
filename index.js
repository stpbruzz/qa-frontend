const API_URL = 'http://localhost:8080'

document.addEventListener('DOMContentLoaded', function() {
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        const closeBtn = editModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeEditModal);
        }
        
        window.addEventListener('click', function(event) {
            if (event.target === editModal) {
                closeEditModal();
            }
        });
    }
    
    loadTasks();
});

async function createTask() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const priority = document.getElementById('priority').value;
    const deadline = document.getElementById('deadline').value;

    const taskDTO = {
        name: name,
        description: description,
        priority: priority || null,
        deadline: deadline ? new Date(deadline).toISOString().split('T')[0] : null
    };

    try {
        const response = await fetch(`${API_URL}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskDTO)
        });

        if (response.ok) {
            loadTasks();
            document.getElementById('name').value = '';
            document.getElementById('description').value = '';
            document.getElementById('priority').value = '';
            document.getElementById('deadline').value = '';
        } else {
            alert('Ошибка при создании задачи');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при создании задачи');
    }
}

async function loadTasks() {
    const status = document.getElementById('status-filter').value;
    const priority = document.getElementById('priority-filter').value;
    const sortOrder = document.getElementById('sort-order').value;

    let url = `${API_URL}/show/all?sortOrder=${sortOrder}`;
    if (status) url += `&status=${status}`;
    if (priority) url += `&priority=${priority}`;

    try {
        const response = await fetch(url);
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке задач');
        }
    }

    function displayTasks(tasks) {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.innerHTML = '<p>Нет задач</p>';
        return;
    }

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
                
        const deadlineClass = getDeadlineClass(task);
        if (deadlineClass) {
            taskElement.classList.add(deadlineClass);
        }

        const creationDate = new Date(task.creationDate).toLocaleDateString();
        const deadlineDate = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Нет дедлайна';
                
        const priorityClass = task.priority.toLowerCase();
                
        const statusClass = task.status.toLowerCase();
        const statusText = {
            'ACTIVE': 'Активная',
            'COMPLETED': 'Завершена',
            'LATE': 'Завершена с опозданием',
            'OVERDUE': 'Просрочена'
        };

        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.name}</div>
                <span class="task-priority ${priorityClass}">${task.priority}</span>
            </div>
            <div class="task-description">${task.description || 'Нет описания'}</div>
            <div class="task-deadline">
                <strong>Дедлайн:</strong> ${deadlineDate} | 
                <strong>Создана:</strong> ${creationDate}
            </div>
            <div class="task-status ${statusClass}">${statusText[task.status]}</div>
            <div class="actions">
                <button onclick="toggleTaskStatus('${task.id}')">
                    ${task.status === 'COMPLETED' || task.status === 'LATE' ? 'Отметить невыполненной' : 'Отметить выполненной'}
                </button>
                <button onclick="openEditModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">Редактировать</button>
                <button class="delete-btn" onclick="deleteTask('${task.id}')">Удалить</button>
            </div>
        `;

        container.appendChild(taskElement);
    });
}

function getDeadlineClass(task) {
    if (task.status === 'COMPLETED' || task.status === 'LATE') {
        return '';
    }
            
    if (!task.deadline) return '';
            
    const today = new Date();
    const deadlineDate = new Date(task.deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
    if (daysDiff < 0) {
        return 'deadline-passed';
    } else if (daysDiff <= 3) {
        return 'deadline-close';
    }
       
    return '';
}

function getDeadlineWarning(task) {
    if (task.status === 'COMPLETED' || task.status === 'LATE' || !task.deadline) {
        return '';
    }
            
    const today = new Date();
    const deadlineDate = new Date(task.deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
        return '<span class="deadline-warning"> (ПРОСРОЧЕНО)</span>';
    } else if (daysDiff <= 3) {
        return `<span class="deadline-warning"> (Осталось ${daysDiff} ${daysDiff === 1 ? 'день' : daysDiff < 5 ? 'дня' : 'дней'})</span>`;
    }    
    return '';
}

function formatDisplayDate(dateString) {
    if (!dateString) return 'Нет даты';
    const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

function getStatusText(status) {
    const statusMap = {
        'ACTIVE': 'Активная',
        'COMPLETED': 'Завершена',
        'LATE': 'Завершена с опозданием',
        'OVERDUE': 'Просрочена'
    };
    return statusMap[status] || status;
}

async function toggleTaskStatus(taskId) {
    try {
        const response = await fetch(`${API_URL}/mark/${taskId}`, {
            method: 'PATCH'
        });

        if (response.ok) {
            loadTasks();
        } else {
            alert('Ошибка при изменении статуса задачи');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при изменении статуса задачи');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
        const response = await fetch(`${API_URL}/delete/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTasks();
        } else {
            alert('Ошибка при удалении задачи');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при удалении задачи');
    }
}
let currentEditTaskId = null;

function openEditModal(task) {
    currentEditTaskId = task.id;
    
    document.getElementById('edit-name').value = task.name;
    document.getElementById('edit-description').value = task.description || '';
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-deadline').value = task.deadline || '';
    
    document.getElementById('edit-modal').style.display = 'block';
}

async function saveEditedTask() {
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    const priority = document.getElementById('edit-priority').value;
    const deadline = document.getElementById('edit-deadline').value;

    const taskDTO = {
        name: name,
        description: description,
        priority: priority,
        deadline: deadline ? new Date(deadline).toISOString().split('T')[0] : null
    };

    try {
        const response = await fetch(`${API_URL}/edit/${currentEditTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskDTO)
        });

        if (response.ok) {
            closeEditModal();
            loadTasks();
        } else {
            alert('Ошибка при сохранении изменений');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при сохранении изменений');
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditTaskId = null;
}

document.querySelector('.close').addEventListener('click', closeEditModal);

window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('edit-modal')) {
        closeEditModal();
    }
});
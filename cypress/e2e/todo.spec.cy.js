describe('ToDo List App', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    beforeEach(() => {
        cy.visit('http://localhost:5500');
    });

    before(() => {
        cy.request('DELETE', 'http://localhost:8080/delete/all');
    });

    it('1. создать задачу с 3 символами в названии невозможно', () => {
        cy.get('#name').type('123');
        cy.get('button[onclick="createTask()"]').click();
        cy.get('.task-item').should("not.exist")
    });

    it('2. создать задачу с 4 символами в названии, остальные поля формы оставить по умолчанию', () => {
        cy.get('#name').type('1234');
        cy.get('button[onclick="createTask()"]').click();
        cy.get('.task-item').should('have.length', 1);
        cy.get('.task-title').should('contain', '1234');
    });

    it('3. отредактировать задачу, изменить все атрибуты, дедлайн установить на завтра', () => {
        cy.get(`.actions button:nth-child(2)`).click();
        cy.get('#edit-name').clear().type('Отредактированная задача');
        cy.get('#edit-description').clear().type('Отредактированное описание');
        cy.get('#edit-priority').select('HIGH');
        cy.get('#edit-deadline').type(formatDate(tomorrow));
        cy.get('#edit-modal button').click();

        cy.get(`.task-title`).should('contain', 'Отредактированная задача');
        cy.get(`.task-description`).should('contain', 'Отредактированное описание');
        cy.get(`.task-priority`).should('contain', 'HIGH');
        cy.get(`.task-deadline`).should('contain', tomorrow.toLocaleDateString());
    });

    it('4. проверить "цвет задачи" - должна быть выделена оранжевым', () => {
        cy.get('.task-item').should('have.class', 'deadline-close');
    });

    it('5. проверить статус задачи - должен быть active', () => {
        cy.get('.task-status').should('contain', 'Активная');
        cy.get('.task-status').should('have.class', 'active');
    });

    it('6. отредактировать задачу, дедлайн установить на вчера', () => {
        cy.get('.actions button:nth-child(2)').first().click();
        cy.get('#edit-deadline').type(formatDate(yesterday));
        cy.get('#edit-modal button').click();

        cy.get(`.task-deadline`).should('contain', yesterday.toLocaleDateString());
    });

    it('7. проверить "цвет задачи" - должна быть выделена красным', () => {
        cy.get('.task-item').should('have.class', 'deadline-passed');
    });

    it('8. проверить статус задачи - должен быть overdue', () => {
        cy.get('.task-status').should('contain', 'Просрочена');
        cy.get('.task-status').should('have.class', 'overdue');
    });

    it('9. отметить задачу как выполненную', () => {
        cy.get('.actions button:first-child').first().click();
    });

    it('10. проверить статус - должен быть late', () => {
        cy.get('.task-status').should('contain', 'Завершена с опозданием');
        cy.get('.task-status').should('have.class', 'late');
    });

    it('11. отметить задачу как невыполненную', () => {
        cy.get('.actions button:first-child').first().click();
    });

    it('12. проверить статус - должен быть overdue', () => {
        cy.get('.task-status').should('contain', 'Просрочена');
        cy.get('.task-status').should('have.class', 'overdue');
    });

    it('13. отметить задачу как выполненную', () => {
        cy.get('.actions button:first-child').first().click();
    });

    it('14. отредактировать задачу, дедлайн установить на конец месяца', () => {
        cy.get('.actions button:nth-child(2)').first().click();
        cy.get('#edit-deadline').type("2025-05-31");
        cy.get('#edit-modal button').click();

        cy.get('.task-deadline').should('contain', "5/31/2025");
    });

    it('15. проверить "цвет задачи" - должен быть дефолтный', () => {
        cy.get('.task-item').should('not.have.class', 'deadline-close');
        cy.get('.task-item').should('not.have.class', 'deadline-passed');
    });

    it('16. проверить статус задачи - должен быть completed', () => {
        cy.get('.task-status').should('contain', 'Завершена');
        cy.get('.task-status').should('have.class', 'completed');
    });

    it('17. создать задачу с макросом !1 в названии, проверить приоритет в созданной задаче', () => {
        cy.get('#name').type('Важная задача!1');
        cy.get('button[onclick="createTask()"]').click();

        cy.contains('.task-item', 'Важная задача').within(() => {
            cy.get('.task-priority').should('contain', 'CRITICAL');
        });
    });

    it('18. создать задачу с макросом !before в названии, проверить дедлайн в созданной задаче', () => {
        cy.get('#name').type(`Задача с дедлайном!before 20.12.2024`);
        cy.get('button[onclick="createTask()"]').click();

        cy.contains('.task-item', 'Задача с дедлайном').within(() => {
            cy.get('.task-deadline').should('contain', "12/20/2024");
        });
    });

    it('19. создать задачу с обоими макросами в названии, проверить приоритет и дедлайн в созданной задаче', () => {
        cy.get('#name').type(`Супер задача!2 !before 20.12.2024`);
        cy.get('button[onclick="createTask()"]').click();

        cy.contains('.task-item', 'Супер задача').within(() => {
            cy.get('.task-priority').should('contain', 'HIGH');
            cy.get('.task-deadline').should('contain', "12/20/2024");
        });
    });

    it('20. создать задачу с обоими макросами в названии, выбрать ДРУГИЕ приоритет и дедлайн в полях формы', () => {
        const testDate = '20.12.2024';
        const formDate = formatDate(tomorrow);
    
        cy.get('#name').type(`Задача с макросами!3 !before ${testDate}`);
        cy.get('#priority').select('LOW');
        cy.get('#deadline').type(formDate);
        cy.get('button[onclick="createTask()"]').click();

        cy.contains('.task-item', 'Задача с макросами').within(() => {
            cy.get('.task-priority').should('contain', 'LOW');
            cy.get('.task-deadline').should('contain', tomorrow.toLocaleDateString());
        });
    });

    it('21. проверить сортировку задач по приоритету и статусу', () => {
        cy.get('#priority-filter').select('HIGH');
        cy.get('button[onclick="loadTasks()"]').click();
        
        cy.get('#tasks-container .task-item').each(($task) => {
            cy.wrap($task).find('.task-priority').should('contain', 'HIGH');
        });
        
        cy.get('#priority-filter').select('');
        cy.get('#status-filter').select('');

        cy.get('#status-filter').select('ACTIVE');
        cy.get('button[onclick="loadTasks()"]').click();
        
        cy.get('#tasks-container .task-item').each(($task) => {
            cy.wrap($task).find('.task-status').should('contain', 'Активная');
        });

        cy.get('#priority-filter').select('');
        cy.get('#status-filter').select('');

        cy.get('#priority-filter').select('HIGH');
        cy.get('#status-filter').select('COMPLETED');
        cy.get('button[onclick="loadTasks()"]').click();
        
        cy.get('#tasks-container .task-item').each(($task) => {
            cy.wrap($task).find('.task-priority').should('contain', 'HIGH');
            cy.wrap($task).find('.task-status').should('contain', 'Завершена');
        });

        cy.get('#priority-filter').select('');
        cy.get('#status-filter').select('');

        cy.get('#priority-filter').select('HIGH');
        cy.get('#status-filter').select('LATE');
        cy.get('button[onclick="loadTasks()"]').click();
        cy.get('#tasks-container .task-item').should("not.exist")

        cy.get('#priority-filter').select('');
        cy.get('#status-filter').select('');

        cy.get('button[onclick="loadTasks()"]').click();
    });

    it('22. удалить любую задачу, проверить, что её нет после удаления', () => {
        cy.contains('.task-title', 'Отредактированная задача').parents('.task-item').find('.delete-btn').click();
            
        cy.on('window:confirm', () => true);
        
        cy.get('#tasks-container').should('not.contain', 'Отредактированная задача');
    });
});
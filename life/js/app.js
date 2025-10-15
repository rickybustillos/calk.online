// js/app.js - CÓDIGO UNIFICADO PARA FUNCIONAR SEM SERVIDOR

// ========== taskManager.js ==========
class TaskManager {
    constructor(storageKey, defaultColors) {
        this.storageKey = storageKey;
        this.defaultColors = defaultColors;
        this.tasks = [];
    }

    loadTasks() {
        try {
            const storedTasks = localStorage.getItem(this.storageKey);
            this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
            return this.tasks;
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
            return this.tasks;
        }
    }

    saveTasks() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    generateTaskId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    addTask(taskData) {
        const newTask = {
            id: this.generateTaskId(),
            name: taskData.name,
            startTime: taskData.startTime,
            endTime: taskData.endTime,
            color: taskData.color || this.getRandomColor()
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    }

    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...taskData
            };
            this.saveTasks();
            return this.tasks[taskIndex];
        }
        return null;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
    }

    clearAllTasks() {
        this.tasks = [];
        localStorage.removeItem(this.storageKey);
    }

    getRandomColor() {
        return this.defaultColors[Math.floor(Math.random() * this.defaultColors.length)];
    }
}

// ========== viewRenderer.js ==========
class ViewRenderer {
    constructor(hourHeight) {
        this.HOUR_HEIGHT = hourHeight;
    }

    renderTimeline(tasks, onTaskClick) {
        const timelineContainer = document.getElementById('timelineContainer');
        if (!timelineContainer) return;
        
        timelineContainer.innerHTML = '';
        
        // Create hour markers
        for (let hour = 0; hour < 24; hour++) {
            const hourElement = document.createElement('div');
            hourElement.className = 'timeline-hour';
            hourElement.style.height = `${this.HOUR_HEIGHT}px`;
            hourElement.style.top = `${hour * this.HOUR_HEIGHT}px`;
            hourElement.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timelineContainer.appendChild(hourElement);
        }
        
        // Create task elements
        tasks.forEach(task => {
            const startTimeParts = task.startTime.split(':');
            const endTimeParts = task.endTime.split(':');
            
            const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
            const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
            
            const taskElement = document.createElement('div');
            taskElement.className = 'timeline-task';
            taskElement.style.backgroundColor = task.color;
            taskElement.style.top = `${(startMinutes / 60) * this.HOUR_HEIGHT}px`;
            taskElement.style.height = `${((endMinutes - startMinutes) / 60) * this.HOUR_HEIGHT}px`;
            taskElement.style.left = '60px';
            taskElement.style.right = '10px';
            taskElement.textContent = `${task.name} (${task.startTime} - ${task.endTime})`;
            
            taskElement.addEventListener('click', () => onTaskClick(task));
            timelineContainer.appendChild(taskElement);
        });
    }

    renderAgenda(tasks, onEditClick, onDeleteClick) {
        const agendaView = document.getElementById('agendaView');
        if (!agendaView) return;
        
        agendaView.innerHTML = '';
        
        if (tasks.length === 0) {
            agendaView.innerHTML = '<p class="text-center text-muted">Nenhuma tarefa cadastrada.</p>';
            return;
        }
        
        const sortedTasks = [...tasks].sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        sortedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'card agenda-item mb-2';
            taskElement.style.borderLeftColor = task.color;
            
            taskElement.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-1">${task.name}</h5>
                        <span class="badge bg-secondary">${this.formatTimeRange(task.startTime, task.endTime)}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="task-color" style="background-color: ${task.color};"></span>
                        <div>
                            <button class="btn btn-sm btn-outline-primary edit-task-btn" data-task-id="${task.id}">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-task-btn" data-task-id="${task.id}">
                                <i class="bi bi-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            agendaView.appendChild(taskElement);
            
            // Add event listeners
            taskElement.querySelector('.edit-task-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                onEditClick(task);
            });
            
            taskElement.querySelector('.delete-task-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                onDeleteClick(task.id);
            });
        });
    }

    renderCalendarView(tasks, onTaskClick) {
        const calendarView = document.getElementById('calendarView');
        if (!calendarView) return;
        
        calendarView.innerHTML = '';
        
        if (tasks.length === 0) {
            calendarView.innerHTML = '<p class="text-center text-muted">Nenhuma tarefa cadastrada.</p>';
            return;
        }
        
        const sortedTasks = [...tasks].sort((a, b) => a.startTime.localeCompare(b.startTime));
        const tasksByHour = {};
        
        for (let hour = 0; hour < 24; hour++) {
            tasksByHour[hour] = [];
        }
        
        sortedTasks.forEach(task => {
            const startHour = parseInt(task.startTime.split(':')[0]);
            if (tasksByHour[startHour]) {
                tasksByHour[startHour].push(task);
            }
        });
        
        for (let hour = 0; hour < 24; hour++) {
            const hourElement = document.createElement('div');
            hourElement.className = 'calendar-hour';
            
            const hourLabel = document.createElement('span');
            hourLabel.className = 'hour-label';
            hourLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
            hourElement.appendChild(hourLabel);
            
            tasksByHour[hour].forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'calendar-task';
                taskElement.style.backgroundColor = task.color;
                taskElement.textContent = `${task.name} (${task.startTime} - ${task.endTime})`;
                taskElement.addEventListener('click', () => onTaskClick(task));
                hourElement.appendChild(taskElement);
            });
            
            calendarView.appendChild(hourElement);
        }
    }

    renderPieChart(tasks, pieChart) {
        const pieChartContainer = document.getElementById('pieChartContainer');
        if (!pieChartContainer) return pieChart;
        
        pieChartContainer.innerHTML = '<canvas id="pieChart"></canvas>';
        const pieChartCanvas = document.getElementById('pieChart');
        
        if (tasks.length === 0) {
            pieChartContainer.innerHTML = '<p class="text-center text-muted">Nenhuma tarefa cadastrada para gerar o gráfico.</p>';
            return pieChart;
        }
        
        const taskData = tasks.map(task => {
            const startTimeParts = task.startTime.split(':');
            const endTimeParts = task.endTime.split(':');
            
            const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
            const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
            
            return {
                name: task.name,
                duration: (endMinutes - startMinutes) / 60,
                color: task.color
            };
        });
        
        if (pieChart) {
            pieChart.destroy();
        }
        
        const ctx = pieChartCanvas.getContext('2d');
        const newPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: taskData.map(task => task.name),
                datasets: [{
                    data: taskData.map(task => task.duration),
                    backgroundColor: taskData.map(task => task.color),
                    borderColor: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 
                                'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.body).color,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value.toFixed(2)}h (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        return newPieChart;
    }

    renderStatsView(stats, currentPeriod, statsChart) {
        this.updateStatsCards(stats, currentPeriod);
        const newStatsChart = this.renderStatsChart(stats, currentPeriod, statsChart);
        this.renderTaskDistribution(stats, currentPeriod);
        this.updateProgressBars(stats);
        return newStatsChart;
    }

    updateStatsCards(stats, currentPeriod) {
        const totalHoursElement = document.getElementById('totalHours');
        const totalHoursPeriodElement = document.getElementById('totalHoursPeriod');
        const uniqueTasksElement = document.getElementById('uniqueTasks');
        const longestTaskElement = document.getElementById('longestTask');
        const longestTaskHoursElement = document.getElementById('longestTaskHours');
        
        if (totalHoursElement) {
            totalHoursElement.textContent = `${stats.hoursByPeriod[currentPeriod].toFixed(1)}h`;
        }
        
        if (totalHoursPeriodElement) {
            totalHoursPeriodElement.textContent = `por ${this.getPeriodLabel(currentPeriod)}`;
        }
        
        if (uniqueTasksElement) {
            uniqueTasksElement.textContent = stats.uniqueTasks;
        }
        
        if (longestTaskElement) {
            longestTaskElement.textContent = stats.longestTask.name;
        }
        
        if (longestTaskHoursElement) {
            longestTaskHoursElement.textContent = `${stats.longestTask.dailyHours.toFixed(1)}h por dia`;
        }
    }

    renderStatsChart(stats, currentPeriod, statsChart) {
        const statsChartCanvas = document.getElementById('statsChart');
        if (!statsChartCanvas) return statsChart;
        
        if (statsChart) {
            statsChart.destroy();
        }
        
        const periodData = stats.taskStats.map(task => task[`${currentPeriod}Hours`]);
        const labels = stats.taskStats.map(task => task.name);
        const colors = stats.taskStats.map(task => task.color);
        
        const ctx = statsChartCanvas.getContext('2d');
        const newStatsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Horas por ${this.getPeriodLabel(currentPeriod)}`,
                    data: periodData,
                    backgroundColor: colors,
                    borderColor: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 
                                'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw.toFixed(1)}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: getComputedStyle(document.body).color },
                        grid: { color: getComputedStyle(document.body).getPropertyValue('--bs-border-color') }
                    },
                    x: {
                        ticks: { 
                            color: getComputedStyle(document.body).color,
                            maxRotation: 45 
                        },
                        grid: { color: getComputedStyle(document.body).getPropertyValue('--bs-border-color') }
                    }
                }
            }
        });

        return newStatsChart;
    }

    renderTaskDistribution(stats, currentPeriod) {
        const container = document.getElementById('taskDistribution');
        if (!container) return;
        
        container.innerHTML = '';
        
        stats.taskStats.forEach(task => {
            const hours = task[`${currentPeriod}Hours`];
            const percentage = stats.hoursByPeriod[currentPeriod] > 0 ? 
                (hours / stats.hoursByPeriod[currentPeriod]) * 100 : 0;
            
            const taskElement = document.createElement('div');
            taskElement.className = 'mb-2';
            taskElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="task-color" style="background-color: ${task.color};"></span>
                        <span>${task.name}</span>
                    </div>
                    <div>
                        <span class="badge bg-secondary">${hours.toFixed(1)}h</span>
                        <small class="text-muted ms-1">${percentage.toFixed(1)}%</small>
                    </div>
                </div>
            `;
            
            container.appendChild(taskElement);
        });
    }

    updateProgressBars(stats) {
        const weekProgress = document.getElementById('weekProgress');
        const monthProgress = document.getElementById('monthProgress');
        const yearProgress = document.getElementById('yearProgress');
        
        if (weekProgress) {
            const weekPercentage = Math.min((stats.hoursByPeriod.week / 168) * 100, 100);
            weekProgress.style.width = `${weekPercentage}%`;
            weekProgress.textContent = `${stats.hoursByPeriod.week.toFixed(1)}h`;
        }
        
        if (monthProgress) {
            const monthPercentage = Math.min((stats.hoursByPeriod.month / 720) * 100, 100);
            monthProgress.style.width = `${monthPercentage}%`;
            monthProgress.textContent = `${stats.hoursByPeriod.month.toFixed(1)}h`;
        }
        
        if (yearProgress) {
            const yearPercentage = Math.min((stats.hoursByPeriod.year / 8760) * 100, 100);
            yearProgress.style.width = `${yearPercentage}%`;
            yearProgress.textContent = `${stats.hoursByPeriod.year.toFixed(1)}h`;
        }
    }

    getPeriodLabel(period) {
        const labels = { week: 'semana', month: 'mês', year: 'ano' };
        return labels[period] || 'período';
    }

    formatTimeRange(startTime, endTime) {
        return `${startTime} - ${endTime}`;
    }
}

// ========== statsCalculator.js ==========
class StatsCalculator {
    calculateStatistics(tasks) {
        // Calculate daily total hours
        const dailyTotal = tasks.reduce((total, task) => {
            try {
                const startTimeParts = task.startTime.split(':');
                const endTimeParts = task.endTime.split(':');
                
                const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
                const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
                
                return total + (endMinutes - startMinutes) / 60;
            } catch (error) {
                console.error('Error calculating task duration:', error);
                return total;
            }
        }, 0);
        
        // Calculate hours by period
        const hoursByPeriod = {
            week: dailyTotal * 7,
            month: dailyTotal * 30,
            year: dailyTotal * 365
        };
        
        // Group tasks by name and calculate total hours per task
        const tasksByName = {};
        tasks.forEach(task => {
            try {
                const startTimeParts = task.startTime.split(':');
                const endTimeParts = task.endTime.split(':');
                
                const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
                const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
                const duration = (endMinutes - startMinutes) / 60;
                
                if (!tasksByName[task.name]) {
                    tasksByName[task.name] = {
                        name: task.name,
                        color: task.color,
                        totalHours: 0,
                        dailyHours: 0
                    };
                }
                
                tasksByName[task.name].totalHours += duration;
                tasksByName[task.name].dailyHours += duration;
            } catch (error) {
                console.error('Error processing task:', error);
            }
        });
        
        // Convert to array and calculate period hours
        const taskStats = Object.values(tasksByName).map(task => ({
            ...task,
            weekHours: task.dailyHours * 7,
            monthHours: task.dailyHours * 30,
            yearHours: task.dailyHours * 365
        }));
        
        // Find longest task
        const longestTask = taskStats.reduce((longest, task) => 
            task.dailyHours > longest.dailyHours ? task : longest, 
            { name: '-', dailyHours: 0 }
        );
        
        return {
            dailyTotal,
            hoursByPeriod,
            taskStats,
            longestTask,
            uniqueTasks: taskStats.length
        };
    }
}

// ========== lifeVisualizer.js ==========
class LifeVisualizer {
    constructor(birthDateKey, lifeExpectancyKey) {
        this.birthDateKey = birthDateKey;
        this.lifeExpectancyKey = lifeExpectancyKey;
    }

    loadUserData() {
        try {
            const storedBirthDate = localStorage.getItem(this.birthDateKey);
            const storedLifeExpectancy = localStorage.getItem(this.lifeExpectancyKey);
            
            return {
                birthDate: storedBirthDate ? new Date(storedBirthDate) : null,
                lifeExpectancy: storedLifeExpectancy ? parseInt(storedLifeExpectancy) : 80
            };
        } catch (error) {
            console.error('Error loading user data:', error);
            return {
                birthDate: null,
                lifeExpectancy: 80
            };
        }
    }

    saveUserData(birthDate, lifeExpectancy) {
        try {
            if (birthDate) {
                localStorage.setItem(this.birthDateKey, birthDate.toISOString());
            }
            localStorage.setItem(this.lifeExpectancyKey, lifeExpectancy.toString());
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    clearUserData() {
        try {
            localStorage.removeItem(this.birthDateKey);
            localStorage.removeItem(this.lifeExpectancyKey);
        } catch (error) {
            console.error('Error clearing user data:', error);
        }
    }

    calculateLifeData(birthDate, lifeExpectancy) {
        const now = new Date();
        const death = new Date(birthDate);
        death.setFullYear(birthDate.getFullYear() + lifeExpectancy);
        
        const livedMs = now - birthDate;
        const totalMs = death - birthDate;
        
        const livedDays = Math.floor(livedMs / (1000 * 60 * 60 * 24));
        const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
        
        const livedWeeks = Math.floor(livedDays / 7);
        const totalWeeks = Math.floor(totalDays / 7);
        
        const livedMonths = Math.floor(livedDays / 30.44);
        const totalMonths = Math.floor(totalDays / 30.44);
        
        const livedYears = now.getFullYear() - birthDate.getFullYear();
        
        const livedPercentage = (livedMs / totalMs) * 100;
        
        return {
            lived: {
                weeks: livedWeeks,
                months: Math.floor(livedMonths),
                years: livedYears
            },
            remaining: {
                weeks: totalWeeks - livedWeeks,
                months: Math.floor(totalMonths - livedMonths),
                years: lifeExpectancy - livedYears
            },
            total: {
                weeks: totalWeeks,
                months: Math.floor(totalMonths),
                years: lifeExpectancy
            },
            percentages: {
                lived: livedPercentage,
                remaining: 100 - livedPercentage
            },
            age: livedYears
        };
    }

    showBirthDatePrompt(onConfigureClick) {
        const lifeView = document.getElementById('lifeView');
        if (!lifeView) return;
        
        lifeView.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-x display-1 text-muted"></i>
                <h3 class="mt-3">Data de Nascimento Não Configurada</h3>
                <p class="text-muted">Para visualizar sua representação de tempo de vida, é necessário configurar sua data de nascimento.</p>
                <button class="btn btn-primary mt-3" id="configureLifeBtn">
                    <i class="bi bi-gear"></i> Configurar Agora
                </button>
            </div>
        `;
        
        const configureBtn = document.getElementById('configureLifeBtn');
        if (configureBtn) {
            configureBtn.addEventListener('click', onConfigureClick);
        }
    }

    renderLifeView(lifeData, onEditSettingsClick) {
        const lifeView = document.getElementById('lifeView');
        if (!lifeView) return;
        
        const statsHTML = `
            <div class="life-stats">
                <div class="row text-center">
                    <div class="col-md-3">
                        <h3>${lifeData.age} anos</h3>
                        <small class="text-muted">Idade Atual</small>
                    </div>
                    <div class="col-md-3">
                        <h3 class="text-primary">${lifeData.percentages.lived.toFixed(1)}%</h3>
                        <small class="text-muted">Vivido</small>
                    </div>
                    <div class="col-md-3">
                        <h3 class="text-success">${lifeData.percentages.remaining.toFixed(1)}%</h3>
                        <small class="text-muted">Restante</small>
                    </div>
                    <div class="col-md-3">
                        <h3>${lifeData.total.years} anos</h3>
                        <small class="text-muted">Expectativa</small>
                    </div>
                </div>
                <div class="progress life-progress mt-3">
                    <div class="progress-bar" role="progressbar" style="width: ${lifeData.percentages.lived}%">
                        ${lifeData.percentages.lived.toFixed(1)}%
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-outline-secondary btn-sm" id="editLifeSettingsBtn">
                        <i class="bi bi-pencil"></i> Editar Configurações
                    </button>
                </div>
            </div>
        `;
        
        lifeView.innerHTML = statsHTML;
        
        const editBtn = document.getElementById('editLifeSettingsBtn');
        if (editBtn) {
            editBtn.addEventListener('click', onEditSettingsClick);
        }
        
        const gridsContainer = document.createElement('div');
        gridsContainer.className = 'life-grid';
        
        // Weeks grid
        // const weeksGrid = this.createLifeGrid(
        //     'Semanas de Vida', 
        //     lifeData.total.weeks, 
        //     52, 
        //     lifeData.lived.weeks, 
        //     'semana'
        // );
        // gridsContainer.appendChild(weeksGrid);
        
        // Months grid
        const monthsGrid = this.createLifeGrid(
            'Meses de Vida', 
            lifeData.total.months, 
            36, 
            lifeData.lived.months, 
            'mês'
        );
        gridsContainer.appendChild(monthsGrid);
        
        // Years grid
        const yearsGrid = this.createLifeGrid(
            'Anos de Vida', 
            lifeData.total.years, 
            10, 
            lifeData.lived.years, 
            'ano'
        );
        gridsContainer.appendChild(yearsGrid);
        
        lifeView.appendChild(gridsContainer);
    }

    createLifeGrid(title, totalUnits, unitsPerRow, livedUnits, unitType) {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'life-unit-group';
        
        const titleElement = document.createElement('h5');
        titleElement.className = 'mb-3';
        titleElement.textContent = `${title} (${livedUnits} de ${totalUnits})`;
        gridContainer.appendChild(titleElement);
        
        const gridElement = document.createElement('div');
        gridElement.style.textAlign = 'center';
        
        for (let i = 0; i < totalUnits; i++) {
            const unit = document.createElement('div');
            unit.className = `life-unit ${i < livedUnits ? 'lived' : 'remaining'}`;
            unit.title = `${unitType} ${i + 1}`;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'unit-tooltip';
            tooltip.textContent = `${unitType.charAt(0).toUpperCase() + unitType.slice(1)} ${i + 1}`;
            unit.appendChild(tooltip);
            
            gridElement.appendChild(unit);
            
            if ((i + 1) % unitsPerRow === 0 && i < totalUnits - 1) {
                gridElement.appendChild(document.createElement('br'));
            }
        }
        
        gridContainer.appendChild(gridElement);
        return gridContainer;
    }
}

// ========== importExport.js ==========
class ImportExport {
    constructor(storageKey, birthDateKey, lifeExpectancyKey) {
        this.storageKey = storageKey;
        this.birthDateKey = birthDateKey;
        this.lifeExpectancyKey = lifeExpectancyKey;
    }

    initializeEventListeners(onExport, onImport, onClear) {
        // Export button
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', onExport);
        }
        
        // Import file input
        const importFileInput = document.getElementById('importFileInput');
        const importDataBtn = document.getElementById('importDataBtn');
        
        if (importFileInput && importDataBtn) {
            importFileInput.addEventListener('change', (e) => {
                importDataBtn.disabled = !e.target.files.length;
            });
            
            // Import button
            importDataBtn.addEventListener('click', () => {
                const file = importFileInput.files[0];
                if (file) {
                    this.readImportFile(file, onImport);
                }
            });
        }
        
        // Clear data button
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', onClear);
        }
    }

    exportData(data) {
        try {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `agenda-rotinas-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert('Dados exportados com sucesso!');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Erro ao exportar dados.');
        }
    }

    readImportFile(file, onImport) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (this.validateImportedData(data)) {
                    onImport(data);
                } else {
                    alert('Formato de arquivo inválido.');
                }
            } catch (error) {
                console.error('Error reading import file:', error);
                alert('Erro ao ler arquivo: Formato inválido');
            }
        };
        
        reader.onerror = () => {
            alert('Erro ao ler arquivo');
        };
        
        reader.readAsText(file);
    }

    validateImportedData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        if (!data.tasks || !Array.isArray(data.tasks)) {
            return false;
        }
        
        // Basic validation of tasks structure
        for (const task of data.tasks) {
            if (!task.id || !task.name || !task.startTime || !task.endTime || !task.color) {
                return false;
            }
        }
        
        return true;
    }
}

// ========== app.js - MAIN APPLICATION ==========
class App {
    constructor() {
        this.tasks = [];
        this.currentEditingTaskId = null;
        this.pieChart = null;
        this.statsChart = null;
        this.currentStatsPeriod = 'week';
        this.userBirthDate = null;
        this.userLifeExpectancy = 80;
        
        // Initialize managers
        this.taskManager = new TaskManager('dailyRoutines', [
            '#0d6efd', '#6c757d', '#198754', '#dc3545', 
            '#ffc107', '#0dcaf0', '#6610f2', '#fd7e14'
        ]);
        
        this.viewRenderer = new ViewRenderer(50);
        this.statsCalculator = new StatsCalculator();
        this.lifeVisualizer = new LifeVisualizer('userBirthDate', 'userLifeExpectancy');
        this.importExport = new ImportExport('dailyRoutines', 'userBirthDate', 'userLifeExpectancy');
        
        this.modals = {};
        
        // Initialize the app
        this.initializeApp();
    }

    initializeApp() {
        this.loadData();
        this.initializeModals();
        this.initializeEventListeners();
        this.renderAllViews();
    }

    loadData() {
        this.tasks = this.taskManager.loadTasks();
        const userData = this.lifeVisualizer.loadUserData();
        this.userBirthDate = userData.birthDate;
        this.userLifeExpectancy = userData.lifeExpectancy;
    }

    initializeModals() {
        this.modals.taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
        this.modals.birthDateModal = new bootstrap.Modal(document.getElementById('birthDateModal'));
        this.modals.importExportModal = new bootstrap.Modal(document.getElementById('importExportModal'));
    }

    initializeEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // New task button
        document.getElementById('newTaskBtn').addEventListener('click', () => {
            this.resetTaskForm();
            this.modals.taskModal.show();
        });

        // Import/Export button
        document.getElementById('importExportBtn').addEventListener('click', () => {
            this.modals.importExportModal.show();
        });
        
        // Task form submission
        document.getElementById('saveTaskBtn').addEventListener('click', () => this.handleSaveTask());
        
        // Delete task button
        document.getElementById('deleteTaskBtn').addEventListener('click', () => this.handleDeleteTask());
        
        // Birth date form submission
        document.getElementById('saveBirthDateBtn').addEventListener('click', () => this.handleSaveBirthDate());
        
        // Import/Export functionality
        this.importExport.initializeEventListeners(
            () => this.exportData(),
            (data) => this.importData(data),
            () => this.clearAllData()
        );
        
        // Modal events
        document.getElementById('taskModal').addEventListener('hidden.bs.modal', () => {
            this.currentEditingTaskId = null;
        });
        
        // Tab switching
        document.getElementById('timeline-tab').addEventListener('click', () => this.renderTimeline());
        document.getElementById('agenda-tab').addEventListener('click', () => this.renderAgenda());
        document.getElementById('piechart-tab').addEventListener('click', () => this.renderPieChart());
        document.getElementById('calendar-tab').addEventListener('click', () => this.renderCalendarView());
        document.getElementById('stats-tab').addEventListener('click', () => this.renderStatsView());
        document.getElementById('life-tab').addEventListener('click', () => this.renderLifeView());
        
        // Period selector for stats
        document.querySelectorAll('input[name="period"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentStatsPeriod = e.target.id;
                this.renderStatsView();
            });
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="bi bi-moon"></i>' : '<i class="bi bi-sun"></i>';
        
        // Re-render views to update colors
        this.renderAllViews();
        if (this.pieChart) this.renderPieChart();
        if (this.statsChart) this.renderStatsView();
    }

    resetTaskForm() {
        document.getElementById('taskId').value = '';
        document.getElementById('taskName').value = '';
        document.getElementById('taskStartTime').value = '';
        document.getElementById('taskEndTime').value = '';
        document.getElementById('taskColor').value = this.taskManager.getRandomColor();
        document.getElementById('deleteTaskBtn').style.display = 'none';
        document.getElementById('taskModalLabel').textContent = 'Nova Tarefa';
    }

    populateTaskForm(task) {
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskStartTime').value = task.startTime;
        document.getElementById('taskEndTime').value = task.endTime;
        document.getElementById('taskColor').value = task.color;
        document.getElementById('deleteTaskBtn').style.display = 'block';
        document.getElementById('taskModalLabel').textContent = 'Editar Tarefa';
    }

    handleSaveTask() {
        const taskId = document.getElementById('taskId').value;
        const taskData = {
            name: document.getElementById('taskName').value,
            startTime: document.getElementById('taskStartTime').value,
            endTime: document.getElementById('taskEndTime').value,
            color: document.getElementById('taskColor').value
        };

        if (!this.validateTaskForm(taskData)) return;

        if (taskId) {
            this.taskManager.updateTask(taskId, taskData);
        } else {
            this.taskManager.addTask(taskData);
        }

        this.tasks = this.taskManager.tasks;
        this.modals.taskModal.hide();
        this.renderAllViews();
    }

    validateTaskForm(taskData) {
        if (!taskData.name || !taskData.startTime || !taskData.endTime) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return false;
        }

        if (taskData.startTime >= taskData.endTime) {
            alert('A hora de término deve ser posterior à hora de início.');
            return false;
        }

        return true;
    }

    handleDeleteTask() {
        const taskId = document.getElementById('taskId').value;
        
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.taskManager.deleteTask(taskId);
            this.tasks = this.taskManager.tasks;
            this.modals.taskModal.hide();
            this.renderAllViews();
        }
    }

    handleSaveBirthDate() {
        const birthDateInput = document.getElementById('birthDate').value;
        const lifeExpectancyInput = document.getElementById('lifeExpectancy').value;
        
        if (!birthDateInput) {
            alert('Por favor, informe sua data de nascimento.');
            return;
        }
        
        const birthDate = new Date(birthDateInput);
        const lifeExpectancy = parseInt(lifeExpectancyInput);
        
        if (birthDate > new Date()) {
            alert('A data de nascimento não pode ser no futuro.');
            return;
        }
        
        this.lifeVisualizer.saveUserData(birthDate, lifeExpectancy);
        this.userBirthDate = birthDate;
        this.userLifeExpectancy = lifeExpectancy;
        this.modals.birthDateModal.hide();
        this.renderLifeView();
    }

    // View rendering methods
    renderAllViews() {
        this.renderTimeline();
        this.renderAgenda();
    }

    renderTimeline() {
        this.viewRenderer.renderTimeline(this.tasks, (task) => {
            this.currentEditingTaskId = task.id;
            this.populateTaskForm(task);
            this.modals.taskModal.show();
        });
    }

    renderAgenda() {
        this.viewRenderer.renderAgenda(this.tasks, (task) => {
            this.currentEditingTaskId = task.id;
            this.populateTaskForm(task);
            this.modals.taskModal.show();
        }, (taskId) => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                this.taskManager.deleteTask(taskId);
                this.tasks = this.taskManager.tasks;
                this.renderAllViews();
            }
        });
    }

    renderCalendarView() {
        this.viewRenderer.renderCalendarView(this.tasks, (task) => {
            this.currentEditingTaskId = task.id;
            this.populateTaskForm(task);
            this.modals.taskModal.show();
        });
    }

    renderPieChart() {
        this.pieChart = this.viewRenderer.renderPieChart(this.tasks, this.pieChart);
    }

    renderStatsView() {
        if (this.tasks.length === 0) {
            document.getElementById('statsView').innerHTML = '<p class="text-center text-muted">Nenhuma tarefa cadastrada para gerar estatísticas.</p>';
            return;
        }
        
        const stats = this.statsCalculator.calculateStatistics(this.tasks);
        this.statsChart = this.viewRenderer.renderStatsView(stats, this.currentStatsPeriod, this.statsChart);
    }

    renderLifeView() {
        if (!this.userBirthDate) {
            this.lifeVisualizer.showBirthDatePrompt(() => {
                this.modals.birthDateModal.show();
            });
            return;
        }
        
        const lifeData = this.lifeVisualizer.calculateLifeData(this.userBirthDate, this.userLifeExpectancy);
        this.lifeVisualizer.renderLifeView(lifeData, () => {
            document.getElementById('birthDate').value = this.userBirthDate.toISOString().split('T')[0];
            document.getElementById('lifeExpectancy').value = this.userLifeExpectancy;
            this.modals.birthDateModal.show();
        });
    }

    // Import/Export methods
    exportData() {
        const exportData = {
            tasks: this.tasks,
            userData: {
                birthDate: this.userBirthDate ? this.userBirthDate.toISOString() : null,
                lifeExpectancy: this.userLifeExpectancy
            },
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        this.importExport.exportData(exportData);
    }

    importData(data) {
        try {
            // Validate imported data
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Formato de dados inválido: tarefas não encontradas');
            }

            if (data.userData) {
                if (data.userData.birthDate) {
                    this.userBirthDate = new Date(data.userData.birthDate);
                }
                if (data.userData.lifeExpectancy) {
                    this.userLifeExpectancy = data.userData.lifeExpectancy;
                }
                this.lifeVisualizer.saveUserData(this.userBirthDate, this.userLifeExpectancy);
            }

            // Import tasks
            this.taskManager.tasks = data.tasks;
            this.taskManager.saveTasks();
            this.tasks = data.tasks;

            this.renderAllViews();
            this.modals.importExportModal.hide();
            
            alert('Dados importados com sucesso!');
        } catch (error) {
            alert('Erro ao importar dados: ' + error.message);
        }
    }

    clearAllData() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
            this.taskManager.clearAllTasks();
            this.lifeVisualizer.clearUserData();
            this.tasks = [];
            this.userBirthDate = null;
            this.userLifeExpectancy = 80;
            
            this.renderAllViews();
            this.modals.importExportModal.hide();
            
            alert('Todos os dados foram removidos.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
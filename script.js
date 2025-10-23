// Enhanced app state with persistence
let userType = null;
let tasks = [];
let habits = [];
let completedToday = 0;
let userName = '';
let userProfileImage = '';
let currentView = 'dashboard';
let streak = 0;
let pomodoroTimer = null;
let pomodoroTimeLeft = 25 * 60;
let pomodoroRunning = false;
let reminders = [];

// Data persistence functions
function saveToLocalStorage() {
    const data = {
        userType,
        tasks,
        habits,
        userName,
        userProfileImage,
        streak,
        reminders,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('achieveMoreData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('achieveMoreData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            // Convert Date objects from strings
            data.tasks.forEach(task => {
                if (task.dueDate) task.dueDate = new Date(task.dueDate);
                if (task.completedAt) task.completedAt = new Date(task.completedAt);
            });
            data.reminders.forEach(reminder => {
                if (reminder.reminderTime) reminder.reminderTime = new Date(reminder.reminderTime);
            });

            userType = data.userType || null;
            tasks = data.tasks || [];
            habits = data.habits || [];
            userName = data.userName || '';
            userProfileImage = data.userProfileImage || '';
            streak = data.streak || 0;
            reminders = data.reminders || [];
            
            // Update UI with loaded data
            if (userName) {
                updatePersonalizedGreeting();
                updateProfileDisplay();
                updatePersonalizedQuotes();
            }
            
            if (userType) {
                const displayElement = document.getElementById('userTypeDisplay');
                if (displayElement) displayElement.textContent = userType;
                updateUploadButtonText();
            }
            
            return true;
        } catch (error) {
            console.error('Error loading saved data:', error);
            return false;
        }
    }
    return false;
}

// Task templates
const taskTemplates = {
    student: [
        { title: 'Study for Math Exam', category: 'study', priority: 'high', duration: 120 },
        { title: 'Complete Assignment', category: 'study', priority: 'medium', duration: 90 },
        { title: 'Read Chapter', category: 'study', priority: 'low', duration: 45 },
        { title: 'Group Project Meeting', category: 'study', priority: 'medium', duration: 60 },
        { title: 'Lab Report', category: 'study', priority: 'high', duration: 75 },
        { title: 'Research Paper', category: 'study', priority: 'medium', duration: 150 }
    ],
    professional: [
        { title: 'Client Meeting', category: 'work', priority: 'high', duration: 60 },
        { title: 'Project Review', category: 'work', priority: 'medium', duration: 90 },
        { title: 'Email Responses', category: 'work', priority: 'low', duration: 30 },
        { title: 'Team Standup', category: 'work', priority: 'medium', duration: 30 },
        { title: 'Quarterly Planning', category: 'work', priority: 'high', duration: 120 },
        { title: 'Code Review', category: 'work', priority: 'medium', duration: 45 }
    ]
};

// AI suggestions pool
const aiSuggestions = [
    "Based on your productivity patterns, consider scheduling your most important tasks between 9-11 AM when you're most focused.",
    "You complete 67% more tasks when you set specific deadlines. Try adding time constraints to your tasks.",
    "Your productivity increases by 40% after completing a 25-minute focus session. Consider using the Pomodoro technique more often.",
    "You tend to procrastinate on tasks marked as 'low priority'. Consider breaking them into smaller, actionable steps.",
    "Your best completion rate is on Tuesdays and Wednesdays. Schedule challenging tasks on these days.",
    "Tasks scheduled in the morning have an 85% completion rate vs 60% in the afternoon. Plan accordingly.",
];

// Enhanced quotes arrays
const welcomeQuotes = [
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear - Atomic Habits" },
    { text: "The most effective way to do it, is to do it.", author: "Amelia Earhart" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "Whatever the mind can conceive and believe, it can achieve.", author: "Napoleon Hill - Think and Grow Rich" },
    { text: "Your habits are how you embody your identity. When you make your bed each day, you embody the identity of an organized person.", author: "James Clear - Atomic Habits" },
    { text: "The compound effect of small daily improvements leads to extraordinary results.", author: "Darren Hardy - The Compound Effect" }
];

const motivationalQuotes = [
    { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear - Atomic Habits" },
    { text: "Desire is the starting point of all achievement.", author: "Napoleon Hill - Think and Grow Rich" },
    { text: "Small changes in behavior can lead to remarkable results.", author: "James Clear - Atomic Habits" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "You become what you repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" }
];

const celebrationQuotes = [
    "Outstanding! You're building the habits that lead to success!",
    "Brilliant work! Every completed task brings you closer to your goals!",
    "Excellent! You're proving that consistency creates extraordinary results!",
    "Fantastic! You're becoming the person you want to be, one task at a time!",
    "Amazing! Your dedication is the foundation of your future success!",
    "Incredible! Small wins like this create massive transformations!",
    "Superb! You're turning your dreams into reality through action!"
];

// Initialize app
function init() {
    // Load saved data first
    const hasData = loadFromLocalStorage();
    
    displayWelcomeQuote();
    displayDailyQuote();
    updateUploadButtonText();
    initializeWeather();
    showRandomAISuggestion();
    initializeDragAndDrop();
    startReminderSystem();
    
    // If we have saved data and user type, go straight to app
    if (hasData && userType) {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        renderTasks();
        updateAllStats();
        renderReminders();
    }
    
    showView('dashboard');
}

// Enhanced file upload with intelligent analysis
function initializeDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
}

function handleFiles(files) {
    const fileArray = Array.from(files);
    displayFilePreview(fileArray);
    analyzeScheduleFiles(fileArray);
}

function displayFilePreview(files) {
    const preview = document.getElementById('uploadPreview');
    const fileList = document.getElementById('fileList');
    
    if (files.length > 0) {
        preview.classList.remove('hidden');
        fileList.innerHTML = files.map(file => `
            <div class="flex items-center space-x-2 text-sm">
                <i class="fas fa-file text-primary-400"></i>
                <span class="text-dark-300">${file.name}</span>
                <span class="text-dark-500">(${(file.size / 1024).toFixed(1)} KB)</span>
            </div>
        `).join('');
    }
}

// Intelligent schedule analysis
function analyzeScheduleFiles(files) {
    const analysisProgress = document.getElementById('analysisProgress');
    const analysisBar = document.getElementById('analysisBar');
    const analysisPercent = document.getElementById('analysisPercent');
    const analysisSteps = document.getElementById('analysisSteps');
    
    if (analysisProgress && analysisSteps) {
        analysisProgress.classList.remove('hidden');
        analysisSteps.innerHTML = '';
    } else {
        // Fallback for missing elements
        generateTasksFromAnalysis(files);
        return;
    }
    
    const steps = [
        'Reading file contents...',
        'Extracting dates and times...',
        'Identifying tasks and assignments...',
        'Setting up reminders...',
        'Creating todo items...',
        'Analysis complete!'
    ];
    
    let currentStep = 0;
    
    const progressInterval = setInterval(() => {
        const progress = ((currentStep + 1) / steps.length) * 100;
        analysisBar.style.width = `${progress}%`;
        analysisPercent.textContent = `${Math.round(progress)}%`;
        
        if (currentStep < steps.length) {
            const stepElement = document.createElement('div');
            stepElement.textContent = `✓ ${steps[currentStep]}`;
            stepElement.className = 'text-primary-400';
            analysisSteps.appendChild(stepElement);
        }
        
        currentStep++;
        
        if (currentStep >= steps.length) {
            clearInterval(progressInterval);
            setTimeout(() => {
                generateTasksFromAnalysis(files);
                setTimeout(() => {
                    closeUploadModal();
                    showNotification('Schedule analyzed successfully! Tasks and reminders have been created.', 'success');
                }, 1000);
            }, 500);
        }
    }, 800);
}

// Generate tasks from intelligent analysis
function generateTasksFromAnalysis(files) {
    const generatedTasks = [];
    const now = new Date();
    
    files.forEach((file, index) => {
        // Simulate intelligent extraction based on file type
        const baseId = Date.now() + index * 1000;
        
        // Simulating different file types giving different tasks
        if (file.type.includes('pdf') || file.type.includes('doc') || file.type.includes('txt')) {
            const assignments = userType === 'student' ? [
                { title: 'Math Assignment Chapter 5', days: 2, priority: 'high' },
                { title: 'History Essay Draft', days: 5, priority: 'medium' },
                { title: 'Science Lab Report', days: 3, priority: 'high' }
            ] : [
                { title: 'Project Charter Review', days: 1, priority: 'high' },
                { title: 'Marketing Strategy Outline', days: 4, priority: 'medium' },
                { title: 'Budget Analysis Report', days: 2, priority: 'high' }
            ];
            
            assignments.forEach((assignment, i) => {
                const dueDate = new Date(now.getTime() + assignment.days * 24 * 60 * 60 * 1000);
                dueDate.setHours(17, 0, 0, 0); // Set a default time
                const task = {
                    id: baseId + i,
                    title: assignment.title,
                    category: userType === 'student' ? 'study' : 'work',
                    priority: assignment.priority,
                    duration: 90,
                    dueDate: dueDate,
                    completed: false,
                    source: 'schedule_analysis'
                };
                
                generatedTasks.push(task);
                createReminder(task, 60 * assignment.days); // Reminder 60 mins before on the day of
            });
            
        } else if (file.type.startsWith('image/')) {
            const scheduleItems = userType === 'student' ? [
                { title: 'Tutoring Session', time: 10, priority: 'medium' },
                { title: 'Library Study Block', time: 14, priority: 'high' }
            ] : [
                { title: 'Team Standup', time: 9, priority: 'high' },
                { title: 'Client Follow-up', time: 15, priority: 'medium' }
            ];
            
            scheduleItems.forEach((item, i) => {
                const taskDate = new Date(now);
                taskDate.setHours(item.time, 0, 0, 0);
                if (taskDate < now) {
                    taskDate.setDate(taskDate.getDate() + 1);
                }
                
                const task = {
                    id: baseId + i + 100,
                    title: item.title,
                    category: userType === 'student' ? 'study' : 'work',
                    priority: item.priority,
                    duration: 60,
                    dueDate: taskDate,
                    completed: false,
                    source: 'image_analysis'
                };
                
                generatedTasks.push(task);
                createReminder(task, 30); // 30 minutes before
            });
        }
    });
    
    tasks.push(...generatedTasks);
    saveToLocalStorage();
    renderTasks();
    updateAllStats();
}

// Reminder system
function createReminder(task, minutesBefore) {
    const reminderTime = new Date(task.dueDate.getTime() - minutesBefore * 60 * 1000);
    
    if (reminderTime > new Date()) {
        const reminder = {
            id: Date.now() + Math.random(),
            taskId: task.id,
            taskTitle: task.title,
            reminderTime: reminderTime,
            minutesBefore: minutesBefore,
            active: true
        };
        
        reminders.push(reminder);
        saveToLocalStorage();
    }
}

function startReminderSystem() {
    setInterval(checkReminders, 60000); // Check every minute
}

function checkReminders() {
    const now = new Date();
    let remindersUpdated = false;
    
    reminders.forEach(reminder => {
        if (reminder.active && new Date(reminder.reminderTime) <= now) {
            showReminderNotification(reminder);
            reminder.active = false;
            remindersUpdated = true;
        }
    });
    
    // Clean up old reminders (older than 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const initialReminderCount = reminders.length;
    reminders = reminders.filter(r => r.active || new Date(r.reminderTime) > oneDayAgo);
    
    if (remindersUpdated || reminders.length !== initialReminderCount) {
        saveToLocalStorage();
        renderReminders();
    }
}

function showReminderNotification(reminder) {
    showNotification(
        `⏰ Reminder: "${reminder.taskTitle}" is due soon!`,
        'warning',
        true
    );
    
    playReminderSound();
}

function renderReminders() {
    const container = document.getElementById('remindersPanel');
    const emptyState = document.getElementById('noReminders');
    
    if (!container || !emptyState) return;
    
    const activeReminders = reminders
        .filter(r => r.active && new Date(r.reminderTime) > new Date())
        .sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
    
    if (activeReminders.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    container.innerHTML = activeReminders.slice(0, 5).map(reminder => {
        const timeUntil = getTimeUntil(reminder.reminderTime);
        return `
            <div class="flex items-center justify-between p-2 bg-dark-200/50 rounded-lg reminder-pulse">
                <div class="flex-1">
                    <h5 class="text-xs font-medium text-white">${reminder.taskTitle}</h5>
                    <p class="text-xs text-dark-400">${timeUntil}</p>
                </div>
                <i class="fas fa-bell text-yellow-400 text-xs"></i>
            </div>
        `;
    }).join('');
}

// Notification system
function showNotification(message, type = 'info', persistent = false) {
    const container = document.getElementById('notificationContainer');
    if (!container) return; // Important for robustness
    
    const notification = document.createElement('div');
    
    const colors = {
        success: 'bg-green-600 border-green-500',
        error: 'bg-red-600 border-red-500',
        warning: 'bg-yellow-600 border-yellow-500',
        info: 'bg-primary-600 border-primary-500'
    };
    
    notification.className = `notification ${colors[type]} text-white p-4 rounded-lg border shadow-lg`;
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span class="text-sm">${message}</span>
            ${persistent ? '<button onclick="this.parentElement.parentElement.remove()" class="ml-auto"><i class="fas fa-times"></i></button>' : ''}
        </div>
    `;
    
    container.prepend(notification); // Prepend to show new notification at the top
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove if not persistent
    if (!persistent) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Weather widget
function initializeWeather() {
    const widget = document.getElementById('weatherWidget');
    if (widget) {
        // Simulate weather data
        const temps = ['18°C', '22°C', '25°C', '19°C', '23°C'];
        const temp = temps[Math.floor(Math.random() * temps.length)];
        const tempElement = document.getElementById('weatherTemp');
        if (tempElement) tempElement.textContent = temp;
        widget.classList.remove('hidden');
    }
}

// AI suggestions
function showRandomAISuggestion() {
    const suggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
    const element = document.getElementById('aiSuggestion');
    if (element) {
        element.textContent = suggestion;
    }
}

// Habit tracking system
function addHabit() {
    const habitName = prompt('Enter habit name:');
    if (habitName) {
        const newHabit = {
            id: Date.now(),
            name: habitName,
            streak: 0,
            completedDates: []
        };
        habits.push(newHabit);
        saveToLocalStorage();
        renderHabits();
    }
}

function renderHabits() {
    const container = document.getElementById('habitsList');
    if (!container) return;
    
    container.innerHTML = habits.map(habit => `
        <div class="flex items-center justify-between p-4 bg-dark-200/50 rounded-lg">
            <div class="flex items-center space-x-3">
                <button onclick="toggleHabit(${habit.id})" class="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary-500 flex items-center justify-center hover:bg-primary-500 transition-colors">
                    ${isHabitCompletedToday(habit) ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                </button>
                <div>
                    <h4 class="font-medium text-white">${habit.name}</h4>
                    <p class="text-sm text-dark-400">${habit.streak} day streak</p>
                </div>
            </div>
            <div class="flex space-x-1">
                ${generateHabitDots(habit)}
            </div>
        </div>
    `).join('');
}

function isHabitCompletedToday(habit) {
    const today = new Date().toDateString();
    return habit.completedDates.includes(today);
}

function generateHabitDots(habit) {
    const dots = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const completed = habit.completedDates.includes(dateStr);
        dots.push(`<div class="w-3 h-3 rounded-full ${completed ? 'bg-primary-500' : 'bg-dark-300'} transition-all hover:scale-125"></div>`);
    }
    return dots.join('');
}

function toggleHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    const today = new Date().toDateString();
    
    if (isHabitCompletedToday(habit)) {
        habit.completedDates = habit.completedDates.filter(date => date !== today);
        habit.streak = Math.max(0, habit.streak - 1);
    } else {
        habit.completedDates.push(today);
        habit.streak++;
    }
    
    saveToLocalStorage();
    renderHabits();
}

// View management
function showView(viewName) {
    const views = ['dashboardView', 'analyticsView', 'pomodoroView', 'habitsView'];
    views.forEach(view => {
        const element = document.getElementById(view);
        if (element) element.classList.add('hidden');
    });
    
    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
        targetView.classList.remove('hidden');
        currentView = viewName;
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-primary-400', 'bg-primary-900/20');
        btn.classList.add('text-dark-400');
        if (btn.outerHTML.includes(`'${viewName}'`)) {
             btn.classList.add('text-primary-400', 'bg-primary-900/20');
        }
    });
    
    if (viewName === 'analytics') {
        generateAnalytics();
    } else if (viewName === 'habits') {
        renderHabits();
    }
    
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

function displayWelcomeQuote() {
    const quote = welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)];
    const quoteElement = document.getElementById('welcomeQuote');
    const authorElement = document.getElementById('quoteAuthor');
    if (quoteElement && authorElement) {
        quoteElement.textContent = `"${quote.text}"`;
        authorElement.textContent = `— ${quote.author}`;
    }
}

function displayDailyQuote() {
    const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    const quoteElement = document.getElementById('dailyQuote');
    const authorElement = document.getElementById('dailyQuoteAuthor');
    if (quoteElement && authorElement) {
        quoteElement.textContent = `"${quote.text}"`;
        authorElement.textContent = `— ${quote.author}`;
    }
}

function selectUserType(type) {
    userType = type;
    const displayElement = document.getElementById('userTypeDisplay');
    if (displayElement) displayElement.textContent = type;
    
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUploadButtonText();
    
    if (tasks.length === 0) {
        loadSampleTasks();
    } else {
        renderTasks();
        updateAllStats();
    }
    
    saveToLocalStorage();
    showView('dashboard');
}

function updateUploadButtonText() {
    const uploadBtn = document.getElementById('uploadButtonText');
    if (uploadBtn) {
        if (userType === 'student') {
            uploadBtn.textContent = 'Timetable';
        } else {
            uploadBtn.textContent = 'Schedule';
        }
    }
}

function loadSampleTasks() {
    const now = new Date();
    const sampleTasks = userType === 'student' ? [
        {
            id: 1,
            title: 'Complete Math Assignment',
            category: 'study',
            dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
            priority: 'high',
            duration: 90,
            completed: false
        },
        {
            id: 2,
            title: 'Review Biology Chapter 5',
            category: 'study',
            dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
            priority: 'medium',
            duration: 60,
            completed: false
        }
    ] : [
        {
            id: 1,
            title: 'Team Meeting Preparation',
            category: 'work',
            dueDate: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
            priority: 'high',
            duration: 45,
            completed: false
        },
        {
            id: 2,
            title: 'Client Proposal Review',
            category: 'work',
            dueDate: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
            priority: 'high',
            duration: 120,
            completed: false
        }
    ];
    
    tasks = sampleTasks;
    saveToLocalStorage();
    renderTasks();
    updateAllStats();
}

function showAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) modal.classList.remove('hidden');
    
    // Show/hide reminder options
    const reminderCheckbox = document.getElementById('taskReminder');
    const reminderOptions = document.getElementById('reminderOptions');
    
    if (reminderCheckbox && reminderOptions) {
        // Ensure the event listener is not added multiple times
        reminderCheckbox.onchange = function() {
            if (this.checked) {
                reminderOptions.classList.remove('hidden');
            } else {
                reminderOptions.classList.add('hidden');
            }
        };
        // Set initial state
        reminderOptions.classList.add('hidden');
        reminderCheckbox.checked = false;
    }
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) modal.classList.add('hidden');
    
    const form = modal.querySelector('form');
    if (form) form.reset();
    
    const durationInput = document.getElementById('taskDuration');
    if (durationInput) durationInput.value = '30';
    
    const reminderOptions = document.getElementById('reminderOptions');
    if (reminderOptions) reminderOptions.classList.add('hidden');
}

function addTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const category = document.getElementById('taskCategory').value;
    const dueDateInput = document.getElementById('taskDueDate').value;
    const dueDate = dueDateInput ? new Date(dueDateInput) : null;
    const priority = document.getElementById('taskPriority').value;
    const duration = parseInt(document.getElementById('taskDuration').value);
    const setReminder = document.getElementById('taskReminder').checked;
    const reminderMinutes = parseInt(document.getElementById('reminderTime').value);

    if (!dueDate) {
        showNotification('Please set a due date and time.', 'error');
        return;
    }

    const newTask = {
        id: Date.now(),
        title,
        category,
        dueDate,
        priority,
        duration,
        completed: false
    };

    tasks.push(newTask);
    
    // Create reminder if requested
    if (setReminder && dueDate > new Date()) {
        createReminder(newTask, reminderMinutes);
    }
    
    saveToLocalStorage();
    renderTasks();
    updateAllStats();
    renderReminders();
    closeAddTaskModal();
    showNotification('Task added successfully!', 'success');
}

function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
        task.completed = true;
        task.completedAt = new Date();
        completedToday++;
        
        // Remove active reminders for this task
        reminders.forEach(r => {
            if (r.taskId === taskId) r.active = false;
        });

        saveToLocalStorage();
        renderTasks();
        updateAllStats();
        renderReminders(); // Re-render reminders to reflect change
        playCompletionSound();
        showCelebration(task);
    }
}

function deleteTask(taskId) {
    showConfirmDialog('Are you sure you want to delete this task?', () => {
        tasks = tasks.filter(t => t.id !== taskId);
        reminders = reminders.filter(r => r.taskId !== taskId);
        saveToLocalStorage();
        renderTasks();
        updateAllStats();
        renderReminders();
        showNotification('Task deleted successfully!', 'info');
    });
}

function showConfirmDialog(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-dark-100/95 backdrop-blur-xl p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-fade-in border border-primary-500/30';
    modalContent.innerHTML = `
        <p class="text-dark-300 mb-4">${message}</p>
        <div class="flex justify-end space-x-3">
            <button id="cancelBtn" class="px-4 py-2 text-dark-400 hover:bg-dark-200 rounded-lg transition-colors">Cancel</button>
            <button id="confirmBtn" class="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg rounded-lg transition-all duration-300 hover:scale-105">Delete</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    modalContent.querySelector('#cancelBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modalContent.querySelector('#confirmBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        onConfirm();
    });
}

function showCelebration(task) {
    const quotesToUse = window.personalizedCelebrationQuotes || celebrationQuotes;
    const quote = quotesToUse[Math.floor(Math.random() * quotesToUse.length)];
    
    const message = userName ? 
        `${userName}, you completed "${task.title}"!` : 
        `You completed "${task.title}"!`;
        
    const celebrationMessageElement = document.getElementById('celebrationMessage');
    const celebrationQuoteElement = document.getElementById('celebrationQuote');
    const celebrationModal = document.getElementById('celebrationModal');

    if (celebrationMessageElement) celebrationMessageElement.textContent = message;
    if (celebrationQuoteElement) celebrationQuoteElement.textContent = quote;
    if (celebrationModal) celebrationModal.classList.remove('hidden');
}

function closeCelebrationModal() {
    const modal = document.getElementById('celebrationModal');
    if (modal) modal.classList.add('hidden');
}

function renderTasks() {
    const container = document.getElementById('todaysTasks');
    const emptyState = document.getElementById('emptyState');
    
    if (!container || !emptyState) return;
    
    const todaysTasks = tasks
        .filter(task => {
            const today = new Date();
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === today.toDateString();
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (todaysTasks.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    container.innerHTML = todaysTasks.map(task => {
        const priorityColor = {
            low: 'bg-green-900/30 text-green-400 border-green-500',
            medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
            high: 'bg-red-900/30 text-red-400 border-red-500'
        };

        const categoryIcon = {
            work: 'fas fa-briefcase',
            study: 'fas fa-book',
            personal: 'fas fa-user',
            health: 'fas fa-heart'
        };

        const hasReminder = reminders.some(r => r.taskId === task.id && r.active && new Date(r.reminderTime) > new Date());

        return `
            <div class="task-item flex items-center space-x-3 p-4 bg-dark-200/70 backdrop-blur-sm rounded-xl border border-primary-500/20 ${task.completed ? 'opacity-60' : ''}">
                <button onclick="completeTask(${task.id})" ${task.completed ? 'disabled' : ''} class="flex-shrink-0 w-6 h-6 rounded-full border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-dark-300 hover:border-primary-500'} flex items-center justify-center transition-all">
                    ${task.completed ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                </button>
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <i class="${categoryIcon[task.category]} text-primary-400"></i>
                        <h3 class="font-medium text-white ${task.completed ? 'line-through' : ''}">${task.title}</h3>
                        ${hasReminder ? '<i class="fas fa-bell text-yellow-400 text-xs" title="Reminder set"></i>' : ''}
                        ${task.source ? '<i class="fas fa-robot text-secondary-400 text-xs" title="Auto-generated from schedule"></i>' : ''}
                    </div>
                    <div class="flex items-center space-x-2 text-xs">
                        <span class="px-2 py-1 rounded-full border ${priorityColor[task.priority]}">${task.priority}</span>
                        <span class="text-dark-500">${new Date(task.dueDate).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                        <span class="text-primary-400 font-medium">${task.duration}min</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="startTaskTimer(${task.id})" class="text-primary-400 hover:text-primary-300 transition-colors p-1 hover:bg-primary-900/20 rounded" title="Start Focus Timer">
                        <i class="fas fa-clock text-sm"></i>
                    </button>
                    <button onclick="deleteTask(${task.id})" class="text-dark-400 hover:text-red-400 transition-colors p-1 hover:bg-red-900/30 rounded" title="Delete Task">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    renderUpcomingEvents();
}

function renderUpcomingEvents() {
    const container = document.getElementById('upcomingEvents');
    const emptyState = document.getElementById('noUpcoming');
    
    if (!container || !emptyState) return;
    
    const upcoming = tasks.filter(task => {
        const now = new Date();
        const taskDate = new Date(task.dueDate);
        return taskDate > now && !task.completed;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

    if (upcoming.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    container.innerHTML = upcoming.map(task => {
        const timeUntil = getTimeUntil(task.dueDate);
        const priorityColor = {
            low: 'bg-green-500',
            medium: 'bg-yellow-500',
            high: 'bg-red-500'
        };
        
        return `
            <div class="flex items-center space-x-3 p-3 bg-dark-200/50 backdrop-blur-sm rounded-lg hover:bg-dark-200/70 transition-all duration-300 border border-primary-500/10">
                <div class="w-2 h-2 rounded-full ${priorityColor[task.priority]}"></div>
                <div class="flex-1">
                    <h4 class="text-sm font-medium text-white">${task.title}</h4>
                    <p class="text-xs text-dark-400">${timeUntil}</p>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeUntil(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `in ${days}d ${hours}h`;
    } else if (hours > 0) {
        return `in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `in ${minutes}m`;
    } else {
        return 'Due now';
    }
}

function updateAllStats() {
    const todaysTasks = tasks.filter(task => {
        const today = new Date();
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === today.toDateString();
    });
    
    const completed = todaysTasks.filter(task => task.completed).length;
    const total = todaysTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    if (progressText) progressText.textContent = `${completed}/${total}`;
    if (progressBar) progressBar.style.width = `${percentage}%`;
    
    const elements = {
        todayCount: total,
        streakCount: streak,
        totalCount: tasks.length,
        successPercent: `${percentage}%`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    const badgesContainer = document.getElementById('achievementBadges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        
        const badges = [];
        if (completed >= 1) {
            badges.push('<span class="bg-yellow-900/30 text-yellow-400 border border-yellow-500 text-xs px-3 py-1 rounded-full animate-bounce-subtle">First Task ⭐</span>');
        }
        if (completed >= 3) {
            badges.push('<span class="bg-blue-900/30 text-blue-400 border border-blue-500 text-xs px-3 py-1 rounded-full animate-bounce-subtle">Productive 🚀</span>');
        }
        if (percentage === 100 && total > 0) {
            badges.push('<span class="bg-green-900/30 text-green-400 border border-green-500 text-xs px-3 py-1 rounded-full animate-bounce-subtle">Perfect Day 🏆</span>');
        }
        if (streak >= 7) {
            badges.push('<span class="bg-purple-900/30 text-purple-400 border border-purple-500 text-xs px-3 py-1 rounded-full animate-bounce-subtle">Week Streak 🔥</span>');
        }
        
        badgesContainer.innerHTML = badges.join('');
    }
}

// Search functionality
function searchTasks(event) {
    const query = event.target.value.toLowerCase();
    
    if (currentView !== 'dashboard') {
        showView('dashboard'); // Switch to dashboard for search results
    }

    if (query === '') {
        renderTasks(); // Re-render all today's tasks
        return;
    }
    
    // Search across all tasks (not just today's)
    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(query) || 
        task.category.toLowerCase().includes(query)
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // Sort by proximity

    const container = document.getElementById('todaysTasks');
    const emptyState = document.getElementById('emptyState');

    if (!container || !emptyState) return;
    
    if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-dark-400">No tasks found matching your search.</div>';
        emptyState.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');

    // Display search results using a simplified task card style
    container.innerHTML = filteredTasks.slice(0, 10).map(task => {
        const priorityColor = {
            low: 'bg-green-900/30 text-green-400 border-green-500',
            medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
            high: 'bg-red-900/30 text-red-400 border-red-500'
        };

        const categoryIcon = {
            work: 'fas fa-briefcase',
            study: 'fas fa-book',
            personal: 'fas fa-user',
            health: 'fas fa-heart'
        };
        
        const hasReminder = reminders.some(r => r.taskId === task.id && r.active && new Date(r.reminderTime) > new Date());
        const dueDateString = new Date(task.dueDate).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

        return `
            <div class="task-item flex items-center space-x-3 p-4 bg-dark-200/70 backdrop-blur-sm rounded-xl border border-primary-500/20 ${task.completed ? 'opacity-60' : ''}">
                <button onclick="completeTask(${task.id})" ${task.completed ? 'disabled' : ''} class="flex-shrink-0 w-6 h-6 rounded-full border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-dark-300 hover:border-primary-500'} flex items-center justify-center transition-all">
                    ${task.completed ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                </button>
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <i class="${categoryIcon[task.category]} text-primary-400"></i>
                        <h3 class="font-medium text-white ${task.completed ? 'line-through' : ''}">${task.title}</h3>
                        ${hasReminder ? '<i class="fas fa-bell text-yellow-400 text-xs" title="Reminder set"></i>' : ''}
                    </div>
                    <div class="flex items-center space-x-2 text-xs">
                        <span class="px-2 py-1 rounded-full border ${priorityColor[task.priority]}">${task.priority}</span>
                        <span class="text-dark-500">${dueDateString}</span>
                        <span class="text-primary-400 font-medium">${task.duration}min</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="startTaskTimer(${task.id})" class="text-primary-400 hover:text-primary-300 transition-colors p-1 hover:bg-primary-900/20 rounded" title="Start Focus Timer">
                        <i class="fas fa-clock text-sm"></i>
                    </button>
                    <button onclick="deleteTask(${task.id})" class="text-dark-400 hover:text-red-400 transition-colors p-1 hover:bg-red-900/30 rounded" title="Delete Task">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Sort functionality - Note: Sorts the entire 'tasks' array, the display will then re-filter for "Today's Tasks"
function sortTasks(sortBy) {
    if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } else if (sortBy === 'time') {
        tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
    // Note: The original implementation sorted the global tasks array, 
    // but the displayed tasks are still filtered to "Today's Tasks" in renderTasks().
    // If we wanted to sort *only* the displayed list, we would sort the 'todaysTasks' array inside renderTasks.
    // Keeping the original logic of sorting global array and re-rendering today's view:
    saveToLocalStorage();
    renderTasks();
}

// Templates functionality
function showTemplatesModal() {
    const modal = document.getElementById('templatesModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderTemplates();
    }
}

function closeTemplatesModal() {
    const modal = document.getElementById('templatesModal');
    if (modal) modal.classList.add('hidden');
}

function renderTemplates() {
    const container = document.getElementById('templatesGrid');
    if (!container) return;
    
    const templates = taskTemplates[userType] || [];
    
    container.innerHTML = templates.map((template, index) => `
        <div class="border border-primary-500/20 bg-dark-200/70 backdrop-blur-sm rounded-lg p-4 hover:border-primary-400/40 transition-all duration-300 cursor-pointer hover:scale-105" onclick="addFromTemplate(${index})">
            <h4 class="font-medium text-white mb-2">${template.title}</h4>
            <div class="flex items-center space-x-2 text-xs text-dark-400">
                <span class="px-2 py-1 rounded bg-primary-900/30 text-primary-400">${template.category}</span>
                <span class="px-2 py-1 rounded bg-dark-300">${template.priority}</span>
                <span class="px-2 py-1 rounded bg-dark-300">${template.duration}min</span>
            </div>
        </div>
    `).join('');
}

function addFromTemplate(index) {
    const template = (taskTemplates[userType] || [])[index];
    if (!template) return;

    const now = new Date();
    // Set due date to today + 2 hours for immediate visibility in dashboard
    const defaultDueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const newTask = {
        id: Date.now(),
        title: template.title,
        category: template.category,
        priority: template.priority,
        duration: template.duration,
        dueDate: defaultDueDate,
        completed: false
    };
    
    tasks.push(newTask);
    saveToLocalStorage();
    renderTasks();
    updateAllStats();
    closeTemplatesModal();
    showNotification('Task added from template!', 'success');
}

// Export functionality
function exportTasks() {
    const dataStr = JSON.stringify({
        tasks,
        habits,
        userType,
        userName,
        reminders,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `achievemore-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!', 'success');
}

// Pomodoro Timer functionality
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const pomodoroTimerElement = document.getElementById('pomodoroTimer');
    const miniTimerElement = document.getElementById('miniTimer');
    const timeString = formatTime(pomodoroTimeLeft);
    
    if (pomodoroTimerElement) pomodoroTimerElement.textContent = timeString;
    if (miniTimerElement) miniTimerElement.textContent = timeString;
}

function startPomodoro() {
    if (!pomodoroRunning) {
        pomodoroRunning = true;
        const startBtn = document.getElementById('startPomodoroBtn');
        const pauseBtn = document.getElementById('pausePomodoroBtn');
        const statusElement = document.getElementById('pomodoroStatus');
        
        if (startBtn) startBtn.classList.add('hidden');
        if (pauseBtn) pauseBtn.classList.remove('hidden');
        if (statusElement) statusElement.textContent = 'Focus time! Stay concentrated.';
        
        pomodoroTimer = setInterval(() => {
            pomodoroTimeLeft--;
            updateTimerDisplay();
            
            if (pomodoroTimeLeft <= 0) {
                clearInterval(pomodoroTimer);
                pomodoroRunning = false;
                if (startBtn) startBtn.classList.remove('hidden');
                if (pauseBtn) pauseBtn.classList.add('hidden');
                if (statusElement) statusElement.textContent = 'Focus session complete! Take a break.';
                playCompletionSound();
                showNotification('Focus session completed! Great job! 🎉', 'success');
                resetPomodoro();
            }
        }, 1000);
    }
}

function pausePomodoro() {
    if (pomodoroRunning) {
        clearInterval(pomodoroTimer);
        pomodoroRunning = false;
        const startBtn = document.getElementById('startPomodoroBtn');
        const pauseBtn = document.getElementById('pausePomodoroBtn');
        const statusElement = document.getElementById('pomodoroStatus');
        
        if (startBtn) startBtn.classList.remove('hidden');
        if (pauseBtn) pauseBtn.classList.add('hidden');
        if (statusElement) statusElement.textContent = 'Paused. Click start to continue.';
    }
}

function resetPomodoro() {
    clearInterval(pomodoroTimer);
    pomodoroRunning = false;
    pomodoroTimeLeft = 25 * 60; // Reset to default
    updateTimerDisplay();
    
    const startBtn = document.getElementById('startPomodoroBtn');
    const pauseBtn = document.getElementById('pausePomodoroBtn');
    const statusElement = document.getElementById('pomodoroStatus');
    
    if (startBtn) startBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (statusElement) statusElement.textContent = 'Ready to focus';
}

function setFocusTime(minutes) {
    if (!pomodoroRunning) {
        pomodoroTimeLeft = minutes * 60;
        updateTimerDisplay();
    }
}

function startQuickPomodoro() {
    showView('pomodoro');
    startPomodoro();
}

function startTaskTimer(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        setFocusTime(task.duration);
        showView('pomodoro');
        startPomodoro();
    }
}

// Analytics
function generateAnalytics() {
    generateWeeklyChart();
    generateCategoryChart();
}

function generateWeeklyChart() {
    const container = document.getElementById('weeklyChart');
    if (!container) return;
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Generate random data based on task length for a more 'realistic' feel
    const maxTasks = Math.max(10, tasks.length / 5);
    const data = days.map(() => Math.floor(Math.random() * maxTasks) + 1);
    
    container.innerHTML = days.map((day, index) => `
        <div class="flex items-center justify-between py-2">
            <span class="text-sm text-dark-400 w-8 font-medium">${day}</span>
            <div class="flex-1 mx-4 bg-dark-200 rounded-full h-3 overflow-hidden">
                <div class="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-1000" style="width: ${(data[index] / maxTasks) * 100}%"></div>
            </div>
            <span class="text-sm font-bold text-white w-6">${data[index]}</span>
        </div>
    `).join('');
}

function generateCategoryChart() {
    const container = document.getElementById('categoryChart');
    if (!container) return;
    
    const categories = ['Work', 'Study', 'Personal', 'Health'];
    const colors = [
        'bg-primary-500',
        'bg-secondary-500',
        'bg-accent-500',
        'bg-yellow-500'
    ];
    
    // Calculate actual task breakdown
    const categoryCounts = tasks.reduce((acc, task) => {
        const categoryKey = task.category.charAt(0).toUpperCase() + task.category.slice(1);
        acc[categoryKey] = (acc[categoryKey] || 0) + 1;
        return acc;
    }, {});

    const totalTasks = tasks.length;

    container.innerHTML = categories.map((category, index) => {
        const count = categoryCounts[category] || 0;
        const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
        
        return `
            <div class="flex items-center justify-between py-2">
                <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 ${colors[index]} rounded-full"></div>
                    <span class="text-sm text-dark-400 font-medium">${category}</span>
                </div>
                <div class="text-sm font-bold text-white flex items-center space-x-2">
                    <span class="text-xs text-dark-400">${Math.round(percentage)}%</span>
                    <span>${count}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Sound effects
function playCompletionSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio not supported or restricted by browser policy.');
    }
}

function playReminderSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
        console.log('Audio not supported or restricted by browser policy.');
    }
}

// Enhanced file upload functionality
function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('hidden');
        initializeDragAndDrop();
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset modal state
        const statusDiv = document.getElementById('uploadStatus');
        const previewDiv = document.getElementById('uploadPreview');
        const progressDiv = document.getElementById('analysisProgress');
        const fileList = document.getElementById('fileList');
        const analysisSteps = document.getElementById('analysisSteps');
        const scheduleFile = document.getElementById('scheduleFile');

        if (statusDiv) statusDiv.classList.add('hidden');
        if (previewDiv) previewDiv.classList.add('hidden');
        if (progressDiv) progressDiv.classList.add('hidden');
        if (fileList) fileList.innerHTML = '';
        if (analysisSteps) analysisSteps.innerHTML = '';
        if (scheduleFile) scheduleFile.value = null; // Clear input field
    }
}

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

function showWelcome() {
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');
    displayWelcomeQuote();
}

// Profile functionality
function showProfileSetup() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('hidden');
        const nameInput = document.getElementById('userName');
        if (userName && nameInput) {
            nameInput.value = userName;
        }
        
        // Show current profile image in preview if available
        if (userProfileImage) {
            showProfilePreview(userProfileImage);
        } else {
            const previewDiv = document.getElementById('profilePreview');
            if (previewDiv) previewDiv.classList.add('hidden');
        }
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('hidden');
        const previewDiv = document.getElementById('profilePreview');
        const statusDiv = document.getElementById('profileStatus');
        const urlInput = document.getElementById('profileUrl');
        
        if (previewDiv) previewDiv.classList.add('hidden');
        if (statusDiv) statusDiv.classList.add('hidden');
        if (urlInput) urlInput.value = '';
    }
}

function handleProfileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            userProfileImage = e.target.result;
            showProfilePreview(e.target.result);
            showProfileStatus('Profile picture uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    } else {
        showProfileStatus('Please select a valid image file.', 'error');
    }
}

function handleProfileUrl() {
    const url = document.getElementById('profileUrl').value.trim();
    if (url) {
        const img = new Image();
        img.onload = function() {
            userProfileImage = url;
            showProfilePreview(url);
            showProfileStatus('Profile picture loaded successfully!', 'success');
        };
        img.onerror = function() {
            showProfileStatus('Failed to load image from URL. Please check the URL and try again.', 'error');
        };
        img.src = url;
    } else {
        showProfileStatus('Please enter a valid URL.', 'error');
    }
}

function showProfilePreview(src) {
    const previewImage = document.getElementById('previewProfileImage');
    const previewDiv = document.getElementById('profilePreview');
    if (previewImage && previewDiv) {
        previewImage.src = src;
        previewDiv.classList.remove('hidden');
    }
}

function saveProfile() {
    const nameInput = document.getElementById('userName');
    const nameValue = nameInput ? nameInput.value.trim() : '';
    
    if (!nameValue) {
        showProfileStatus('Please enter your name.', 'error');
        return;
    }

    userName = nameValue;
    updatePersonalizedGreeting();
    updateProfileDisplay();
    updatePersonalizedQuotes();
    saveToLocalStorage();
    
    showProfileStatus('Profile saved successfully!', 'success');
    
    setTimeout(() => {
        closeProfileModal();
        showNotification('Profile updated successfully!', 'success');
    }, 1500);
}

function updatePersonalizedGreeting() {
    if (userName) {
        const greetings = [
            `Welcome back, ${userName}!`,
            `Hello, ${userName}! Ready to achieve greatness?`,
            `Good to see you, ${userName}! Let's make today count!`,
            `Hey ${userName}! Time to turn your goals into reality!`,
            `Welcome, ${userName}! Your success journey continues!`
        ];
        
        const timeOfDay = new Date().getHours();
        let timeGreeting = '';
        
        if (timeOfDay < 12) {
            timeGreeting = `Good morning, ${userName}!`;
        } else if (timeOfDay < 17) {
            timeGreeting = `Good afternoon, ${userName}!`;
        } else {
            timeGreeting = `Good evening, ${userName}!`;
        }
        
        const selectedGreeting = Math.random() > 0.5 ? timeGreeting : greetings[Math.floor(Math.random() * greetings.length)];
        
        const welcomeElement = document.getElementById('personalWelcome');
        if (welcomeElement) {
            welcomeElement.innerHTML = `
                ${selectedGreeting}<br>
                <span class="text-base sm:text-lg text-dark-400">Ready to achieve your goals today?</span>
            `;
        }
    }
}

function updateProfileDisplay() {
    const defaultProfile = document.getElementById('defaultProfile');
    const userProfile = document.getElementById('userProfile');
    
    if (userProfileImage && defaultProfile && userProfile) {
        userProfile.src = userProfileImage;
        defaultProfile.classList.add('hidden');
        userProfile.classList.remove('hidden');
    } else if (defaultProfile && userProfile) {
        // Fallback to default if image is removed
        defaultProfile.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
    
    const setupBtn = document.getElementById('profileSetupBtn');
    if ((userName || userProfileImage) && setupBtn) {
        setupBtn.innerHTML = '<i class="fas fa-user-edit mr-1"></i> Edit Profile';
    }
}

function updatePersonalizedQuotes() {
    if (userName) {
        const personalizedCelebrationQuotes = [
            `Outstanding work, ${userName}! You're building the habits that lead to success!`,
            `Brilliant job, ${userName}! Every completed task brings you closer to your goals!`,
            `Excellent work, ${userName}! You're proving that consistency creates extraordinary results!`,
            `Fantastic effort, ${userName}! You're becoming the person you want to be, one task at a time!`,
            `Amazing progress, ${userName}! Your dedication is the foundation of your future success!`,
            `Well done, ${userName}! You're turning your dreams into reality through action!`,
            `Incredible, ${userName}! Small wins like this create massive transformations!`
        ];
        
        window.personalizedCelebrationQuotes = personalizedCelebrationQuotes;
    }
}

function showProfileStatus(message, type) {
    const statusDiv = document.getElementById('profileStatus');
    if (statusDiv) {
        statusDiv.className = `p-3 rounded-lg text-sm ${type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-500' : 'bg-red-900/30 text-red-400 border border-red-500'}`;
        statusDiv.textContent = message;
        statusDiv.classList.remove('hidden');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

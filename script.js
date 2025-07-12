let currentUser = null;
let quill = null;
let answerQuill = null;
let currentPage = 'home';
let currentFilter = 'latest';
let currentQuestionPage = 1;
let questionsPerPage = 5;
let searchTerm = '';
let selectedTags = [];
let notifications = [
    {
        id: 1,
        type: 'answer',
        message: 'Someone answered your question',
        timestamp: '2 minutes ago',
        read: false
    },
    {
        id: 2,
        type: 'mention',
        message: '@john mentioned you in a comment',
        timestamp: '1 hour ago',
        read: false
    },
    {
        id: 3,
        type: 'vote',
        message: 'Your answer was helpful',
        timestamp: '3 hours ago',
        read: false
    }
];

const API_BASE_URL = 'http://localhost:5000/api';

let sampleQuestions = [
    {
        id: 1,
        title: "How to join 2 columns in a data set to make a separate column in SQL",
        description: "I do not know the code for it as I am a beginner. As an example what I need to do is like there is a column 1 containing First name, and column 2 consists of last name I want a column to combine both first name and last name into a single column called Full Name. Can someone help me with the SQL syntax?",
        answers: 2,
        views: 124,
        tags: ["SQL", "Database", "Beginner"],
        author: "John Doe",
        authorId: 1,
        timestamp: "2 hours ago",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        accepted: true,
        answersList: [
            {
                id: 1,
                content: "You can use the CONCAT function in SQL. Here's how: SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM your_table;",
                author: "SQL Expert",
                authorId: 2,
                timestamp: "1 hour ago",
                accepted: true
            },
            {
                id: 2,
                content: "Alternatively, you can use the || operator: SELECT first_name || ' ' || last_name AS full_name FROM your_table;",
                author: "Database Pro",
                authorId: 3,
                timestamp: "30 minutes ago",
                accepted: false
            }
        ]
    },
    {
        id: 2,
        title: "How to implement responsive design with CSS Grid",
        description: "I am trying to create a responsive layout using CSS Grid but I am having trouble with the grid-template-areas property. Can someone explain how to make it work properly across different screen sizes? I want to reorganize my layout on mobile devices.",
        answers: 1,
        views: 89,
        tags: ["CSS", "Grid", "Responsive"],
        author: "Jane Smith",
        authorId: 2,
        timestamp: "4 hours ago",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        accepted: false,
        answersList: [
            {
                id: 3,
                content: "Use media queries with grid-template-areas. Define different layouts for different screen sizes.",
                author: "CSS Ninja",
                authorId: 4,
                timestamp: "3 hours ago",
                accepted: false
            }
        ]
    },
    {
        id: 3,
        title: "JavaScript async/await vs Promises - which one to use?",
        description: "I am confused about when to use async/await and when to use traditional Promises. What are the pros and cons of each approach? Are there specific scenarios where one is better than the other?",
        answers: 0,
        views: 156,
        tags: ["JavaScript", "Async", "Promises"],
        author: "Mike Johnson",
        authorId: 3,
        timestamp: "6 hours ago",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        accepted: false,
        answersList: []
    }
];

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {

    initializeQuillEditor();
    
    
    loadQuestions();
    
    
    updateNotificationCount();
    
    
    showPage('home');
    
    
    setupEventListeners();
}

function initializeQuillEditor() {
    quill = new Quill('#editor', {
        modules: {
            toolbar: '#toolbar'
        },
        theme: 'snow',
        placeholder: 'Describe your question in detail...'
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchQuestions, 300));
    }
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('loginModal');
        const deleteModal = document.getElementById('deleteModal');
        if (event.target === modal) {
            closeModal();
        }
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeDeleteModal();
            closeNotifications();
        }

        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            if (searchInput) {
                searchInput.focus();
            }
        }
    });
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
    }
    
    updateNavigation();
}

function updateNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.textContent.toLowerCase().includes(currentPage)) {
            link.classList.add('active');
        }
    });
}

function loadQuestions() {
    displayQuestions(getFilteredQuestions());
    updatePagination();
}

function getFilteredQuestions() {
    let filteredQuestions = [...sampleQuestions];
    
    if (searchTerm) {
        filteredQuestions = filteredQuestions.filter(question =>
            question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    // Apply sorting
    switch (currentFilter) {
        case 'latest':
            filteredQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'popular':
            filteredQuestions.sort((a, b) => b.views - a.views);
            break;
        case 'unanswered':
            filteredQuestions = filteredQuestions.filter(q => q.answers === 0);
            break;
    }
    
    return filteredQuestions;
}

function displayQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    if (!container) return;
    
    if (questions.length === 0) {
        container.innerHTML = `
            <div class="no-questions">
                <h3>No questions found</h3>
                <p>Try adjusting your search criteria or be the first to ask a question!</p>
                <button class="btn-primary" onclick="showPage('ask')">Ask a Question</button>
            </div>
        `;
        return;
    }
    
    const startIndex = (currentQuestionPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const questionsToShow = questions.slice(startIndex, endIndex);
    
    container.innerHTML = questionsToShow.map(question => `
        <div class="question-card" onclick="showQuestionDetail(${question.id})">
            <button class="delete-btn" onclick="deleteQuestion(${question.id}, event)" title="Delete Question">
                <i class="fas fa-trash"></i>
            </button>
            <div class="question-header">
                <h3 class="question-title">${question.title}</h3>
                <div class="question-stats">
                    <div class="stat-item">
                        <span class="stat-number">${question.answers}</span>
                        <span class="stat-label">answers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${question.views}</span>
                        <span class="stat-label">views</span>
                    </div>
                </div>
            </div>
            <div class="question-description">
                ${question.description.substring(0, 200)}${question.description.length > 200 ? '...' : ''}
            </div>
            <div class="question-footer">
                <div class="question-tags">
                    ${question.tags.map(tag => `<span class="tag" onclick="searchByTag('${tag}', event)">${tag}</span>`).join('')}
                </div>
                <div class="question-meta">
                    Asked by <strong>${question.author}</strong> ${question.timestamp}
                    ${question.accepted ? '<i class="fas fa-check-circle" style="color: #27ae60; margin-left: 0.5rem;" title="Has accepted answer"></i>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function searchQuestions() {
    const searchInput = document.getElementById('searchInput');
    searchTerm = searchInput ? searchInput.value.trim() : '';
    currentQuestionPage = 1;
    loadQuestions();
}

function searchByTag(tag, event) {
    event.stopPropagation();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = tag;
        searchQuestions();
    }
}

function filterQuestions(filter) {
    currentFilter = filter;
    currentQuestionPage = 1;
    
    // Update filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === filter) {
            btn.classList.add('active');
        }
    });
    
    loadQuestions();
}

function showQuestionDetail(questionId) {
    const question = sampleQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    question.views += 1;
    
    const detailContainer = document.getElementById('questionDetail');
    if (!detailContainer) return;
    
    detailContainer.innerHTML = `
        <div class="question-detail">
            <div class="question-detail-header">
                <h1 class="question-detail-title">${question.title}</h1>
                <div class="question-stats">
                    <div class="stat-item">
                        <span class="stat-number">${question.answers}</span>
                        <span class="stat-label">answers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${question.views}</span>
                        <span class="stat-label">views</span>
                    </div>
                </div>
            </div>
            <div class="question-detail-content">
                ${question.description}
            </div>
            <div class="question-detail-footer">
                <div class="question-tags">
                    ${question.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="question-meta">
                    Asked by <strong>${question.author}</strong> ${question.timestamp}
                </div>
            </div>
        </div>
        
        <div class="answers-section">
            <div class="answers-header">
                <h3>${question.answers} Answers</h3>
            </div>
            <div class="answers-container">
                ${question.answersList.map(answer => `
                    <div class="answer-card">
                        <button class="delete-btn" onclick="deleteAnswer(${question.id}, ${answer.id}, event)" title="Delete Answer">
                            <i class="fas fa-trash"></i>
                        </button>
                        <div class="answer-content">
                            ${answer.content}
                        </div>
                        <div class="answer-footer">
                            <div class="answer-meta">
                                Answered by <strong>${answer.author}</strong> ${answer.timestamp}
                                ${answer.accepted ? '<i class="fas fa-check-circle" style="color: #27ae60; margin-left: 0.5rem;" title="Accepted answer"></i>' : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="answer-form">
            <h3>Your Answer</h3>
            <div class="answer-editor-container">
                <div id="answer-editor"></div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="showPage('home')">Back to Questions</button>
                <button type="button" class="btn-primary" onclick="submitAnswer(${question.id})">Post Answer</button>
            </div>
        </div>
    `;
    
    answerQuill = new Quill('#answer-editor', {
        theme: 'snow',
        placeholder: 'Write your answer here...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                ['link', 'blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }]
            ]
        }
    });
    
    showPage('questionDetail');
}

function deleteQuestion(questionId, event) {
    event.stopPropagation();
    
    const question = sampleQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    const deleteModal = document.getElementById('deleteModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    deleteMessage.textContent = `Are you sure you want to delete the question "${question.title}"?`;
    
    confirmBtn.onclick = function() {
    
        const index = sampleQuestions.findIndex(q => q.id === questionId);
        if (index > -1) {
            sampleQuestions.splice(index, 1);
        }
        
        loadQuestions();
        closeDeleteModal();
        
        showNotification('Question deleted successfully');
    };
    
    deleteModal.classList.add('show');
}

function deleteAnswer(questionId, answerId, event) {
    event.stopPropagation();
    
    const question = sampleQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    const answer = question.answersList.find(a => a.id === answerId);
    if (!answer) return;
    
    const deleteModal = document.getElementById('deleteModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    deleteMessage.textContent = 'Are you sure you want to delete this answer?';
    
    confirmBtn.onclick = function() {
        // Remove answer from question
        const answerIndex = question.answersList.findIndex(a => a.id === answerId);
        if (answerIndex > -1) {
            question.answersList.splice(answerIndex, 1);
            question.answers = question.answersList.length;
        }
        
        showQuestionDetail(questionId);
        closeDeleteModal();

        showNotification('Answer deleted successfully');
    };
    
    deleteModal.classList.add('show');
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.classList.remove('show');
}

function submitAnswer(questionId) {
    if (!answerQuill) return;
    
    const content = answerQuill.root.innerHTML.trim();
    if (!content || content === '<p><br></p>') {
        alert('Please write an answer before submitting.');
        return;
    }
    
    const question = sampleQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    const newAnswer = {
        id: Date.now(), 
        content: content,
        author: currentUser ? currentUser.username : 'Anonymous User',
        authorId: currentUser ? currentUser.id : 0,
        timestamp: 'just now',
        accepted: false
    };
    
    
    question.answersList.push(newAnswer);
    question.answers = question.answersList.length;
    
    
    showQuestionDetail(questionId);
    
    // Show success message
    showNotification('Answer posted successfully');
}


function submitQuestion(event) {
    event.preventDefault();
    
    const title = document.getElementById('questionTitle').value.trim();
    const description = quill.root.innerHTML.trim();
    const tags = selectedTags;
    
    if (!title) {
        alert('Please enter a question title.');
        return;
    }
    
    if (!description || description === '<p><br></p>') {
        alert('Please provide a question description.');
        return;
    }
    
    if (tags.length === 0) {
        alert('Please add at least one tag.');
        return;
    }
    
    const newQuestion = {
        id: Date.now(), 
        title: title,
        description: description,
        answers: 0,
        views: 0,
        tags: tags,
        author: currentUser ? currentUser.username : 'Anonymous User',
        authorId: currentUser ? currentUser.id : 0,
        timestamp: 'just now',
        createdAt: new Date(),
        accepted: false,
        answersList: []
    };
    
    // Add question to array
    sampleQuestions.unshift(newQuestion);
    
    // Reset form
    document.getElementById('questionTitle').value = '';
    quill.setContents([]);
    selectedTags = [];
    updateTagsDisplay();
    
    // Go back to home page
    showPage('home');
    loadQuestions();
    
    // Show success message
    showNotification('Question posted successfully');
}

// Tag Management
function handleTagInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const tag = input.value.trim();
        
        if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
            selectedTags.push(tag);
            input.value = '';
            updateTagsDisplay();
        }
    }
}

function updateTagsDisplay() {
    const tagsDisplay = document.getElementById('tagsDisplay');
    if (!tagsDisplay) return;
    
    tagsDisplay.innerHTML = selectedTags.map(tag => `
        <div class="tag-item">
            ${tag}
            <span class="tag-remove" onclick="removeTag('${tag}')">&times;</span>
        </div>
    `).join('');
}

function removeTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    updateTagsDisplay();
}

// Notification Management
function updateNotificationCount() {
    const countElement = document.getElementById('notificationCount');
    if (countElement) {
        const unreadCount = notifications.filter(n => !n.read).length;
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function closeNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function showNotification(message) {
    // Simple notification system - you can enhance this
    const notification = {
        id: Date.now(),
        type: 'info',
        message: message,
        timestamp: 'just now',
        read: false
    };
    
    notifications.unshift(notification);
    updateNotificationCount();
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        const index = notifications.findIndex(n => n.id === notification.id);
        if (index > -1) {
            notifications[index].read = true;
            updateNotificationCount();
        }
    }, 3000);
}

// Authentication
function toggleAuth() {
    if (currentUser) {
        logout();
    } else {
        openLoginModal();
    }
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    // Simple authentication - replace with real auth
    currentUser = {
        id: 1,
        username: 'Demo User',
        email: 'demo@example.com'
    };
    
    updateAuthButton();
    closeModal();
    showNotification('Logged in successfully');
}

function logout() {
    currentUser = null;
    updateAuthButton();
    showNotification('Logged out successfully');
}

function updateAuthButton() {
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.textContent = currentUser ? 'Logout' : 'Login';
    }
}

function showRegister() {
    // Simple registration placeholder
    alert('Registration feature would be implemented here');
}

// Pagination
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const filteredQuestions = getFilteredQuestions();
    const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentQuestionPage - 1})" 
                ${currentQuestionPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" 
                    ${i === currentQuestionPage ? 'class="active"' : ''}>
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentQuestionPage + 1})" 
                ${currentQuestionPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    const filteredQuestions = getFilteredQuestions();
    const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
    
    if (page >= 1 && page <= totalPages) {
        currentQuestionPage = page;
        loadQuestions();
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize on load
window.addEventListener('load', function() {
    // Any additional initialization can go here
    console.log('StackIt Q&A Platform loaded successfully');
});


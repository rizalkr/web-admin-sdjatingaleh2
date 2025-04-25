document.addEventListener('DOMContentLoaded', init);

async function init() {
    if (!auth.getToken()) {
        redirectToLogin();
        return;
    }

    try {
        loadInitialData();
        setupEventListeners();
    } catch (error) {
        console.error(error);
    }
}

function redirectToLogin() {
    window.location.href = "login.html";
}

function loadInitialData() {
    loadTeachers();
    loadStudents();
    loadNews();
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', () => {
        auth.logout();
        redirectToLogin();
    });

    const createTeacherBtn = document.getElementById('createTeacherBtn');
    createTeacherBtn?.addEventListener('click', () => {
        const teacherData = {
            name: document.getElementById('createTeacherName')?.value,
            username: document.getElementById('createTeacherUsername')?.value,
            email: document.getElementById('createTeacherEmail')?.value,
            subject: document.getElementById('createTeacherSubject')?.value
        };
        createTeacher(teacherData);
    });

    const createStudentBtn = document.getElementById('createStudentBtn');
    createStudentBtn?.addEventListener('click', () => {
        const studentData = {
            name: document.getElementById('createStudentName')?.value,
            age: Number(document.getElementById('createStudentAge')?.value),
            class: document.getElementById('createStudentClass')?.value
        };
        student.createStudent(studentData);
    });

    const createNewsBtn = document.getElementById('createNewsBtn');
    createNewsBtn?.addEventListener('click', () => {
        const newsData = {
            title: document.getElementById('createNewsTitle')?.value,
            content: document.getElementById('createNewsContent')?.value
        };
        news.createNews(newsData);
    });
}

// Helper: Tambahkan header Authorization
function getAuthHeaders() {
    const token = auth.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

const API_BASE_URL = 'http://localhost:3000';

// Helper: Fungsi fetch wrapper dengan base URL
async function apiFetch(endpoint, options = {}) {
    const response = await fetch(API_BASE_URL + endpoint, {
        ...options,
        headers: { ...getAuthHeaders(), ...(options.headers || {}) }
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error (${response.status}) di ${endpoint}: ${errorText}`);
    }
    return response.json();
}
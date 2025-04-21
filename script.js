// Configuration
const pollConfig = {
    title: "Modern Opinion Poll",
    shuffleQuestions: true,
    randomizeOptions: true,
    showProgress: true,
    swipeEnabled: true
};

// DOM Elements
const elements = {
    pollTitle: document.getElementById('poll-title'),
    questionContainer: document.querySelector('.question-container'),
    progressBar: document.querySelector('.progress-bar'),
    completionScreen: document.querySelector('.completion-screen'),
    restartBtn: document.querySelector('.restart-btn'),
    swipeArea: document.getElementById('swipe-area'),
    swipeHint: document.querySelector('.swipe-hint')
};

// State
let currentQuestionIndex = 0;
let questions = [];
let answers = [];
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50;

// Initialize the poll
async function initPoll() {
    try {
        await loadQuestions();
        setupEventListeners();
        elements.pollTitle.textContent = pollConfig.title;
        showQuestion(currentQuestionIndex);
    } catch (error) {
        console.error("Poll initialization error:", error);
        questions = getFallbackQuestions();
        showQuestion(currentQuestionIndex);
    }
}

// Load questions from XML
function loadQuestions() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'questions.xml', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    parseQuestions(xhr.responseXML);
                    resolve();
                } else {
                    reject(new Error("Failed to load questions"));
                }
            }
        };
        xhr.send();
    });
}

function parseQuestions(xmlDoc) {
    const questionNodes = xmlDoc.getElementsByTagName('question');
    questions = Array.from(questionNodes).map(node => {
        const options = Array.from(node.getElementsByTagName('option')).map(opt => ({
            text: opt.textContent,
            value: opt.getAttribute('value') || opt.textContent
        }));
        
        if (pollConfig.randomizeOptions) shuffleArray(options);
        
        return {
            text: node.getElementsByTagName('text')[0].textContent,
            options: options,
            required: node.getAttribute('required') === 'true'
        };
    });
    
    if (pollConfig.shuffleQuestions) shuffleArray(questions);
}

// Fallback questions
function getFallbackQuestions() {
    return [
        {
            text: "What's your favorite color?",
            options: [
                { text: "Blue", value: "blue" },
                { text: "Red", value: "red" },
                { text: "Green", value: "green" },
                { text: "Yellow", value: "yellow" }
            ],
            required: true
        },
        {
            text: "How often do you exercise?",
            options: [
                { text: "Daily", value: "daily" },
                { text: "Weekly", value: "weekly" },
                { text: "Monthly", value: "monthly" },
                { text: "Never", value: "never" }
            ],
            required: true
        }
    ];
}

// Show question
function showQuestion(index) {
    if (index >= questions.length) {
        completePoll();
        return;
    }
    
    const question = questions[index];
    const activeCard = document.querySelector('.question-card.active');
    
    // Hide swipe hint on last question
    elements.swipeHint.style.display = index >= questions.length - 1 ? 'none' : 'block';
    
    // Exit current card
    if (activeCard) {
        activeCard.classList.remove('active');
        activeCard.classList.add('exiting');
        
        setTimeout(() => {
            activeCard.classList.remove('exiting');
            activeCard.style.display = 'none';
        }, 600);
    }
    
    // Create new card
    const card = document.createElement('div');
    card.className = 'question-card';
    elements.questionContainer.appendChild(card);
    
    // Update progress
    if (pollConfig.showProgress) {
        elements.progressBar.style.width = `${(index / questions.length) * 100}%`;
    }
    
    // Render question
    card.innerHTML = `
        <h2 class="question-text">${question.text}</h2>
        <div class="options-container"></div>
        <button class="next-btn" ${question.required ? 'disabled' : ''}>
            <span class="btn-text">${index === questions.length - 1 ? 'Submit Answers' : 'Continue'}</span>
            <span class="btn-arrow">→</span>
        </button>
    `;
    
    // Add options
    const optionsContainer = card.querySelector('.options-container');
    question.options.forEach(option => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = option.text;
        optionBtn.dataset.value = option.value;
        optionBtn.addEventListener('click', () => selectOption(optionBtn, card));
        optionsContainer.appendChild(optionBtn);
    });
    
    // Add next button event
    card.querySelector('.next-btn').addEventListener('click', () => goToNextQuestion(card));
    
    // Show card
    setTimeout(() => {
        card.style.display = 'flex';
        setTimeout(() => card.classList.add('active'), 50);
    }, 50);
}

// Select option
function selectOption(optionBtn, card) {
    card.querySelectorAll('.option-btn').forEach(opt => opt.classList.remove('selected'));
    optionBtn.classList.add('selected');
    
    const nextBtn = card.querySelector('.next-btn');
    if (nextBtn.disabled) nextBtn.disabled = false;
}

// Next question
function goToNextQuestion(card) {
    const selectedOption = card.querySelector('.option-btn.selected');
    answers.push({
        question: questions[currentQuestionIndex].text,
        answer: selectedOption ? selectedOption.dataset.value : 'skipped',
        timestamp: new Date().toISOString()
    });
    
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
}

// Complete poll
function completePoll() {
    saveAnswers();
    elements.completionScreen.classList.add('active');
    elements.swipeHint.style.display = 'none';
}

// Save answers
function saveAnswers() {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
    <submissions>
        <poll>
            <title>${escapeXML(pollConfig.title)}</title>
            <timestamp>${new Date().toISOString()}</timestamp>
            <questions>${questions.length}</questions>
        </poll>
        <answers>
            ${answers.map(answer => `
            <answer>
                <question>${escapeXML(answer.question)}</question>
                <value>${escapeXML(answer.answer)}</value>
                <timestamp>${answer.timestamp}</timestamp>
            </answer>
            `).join('')}
        </answers>
    </submissions>`;
    
    console.log('Poll submission:', xmlString);
    // In production: send to server
}

// Swipe handling
function setupEventListeners() {
    // Swipe events
    if (pollConfig.swipeEnabled) {
        elements.swipeArea.addEventListener('touchstart', handleTouchStart, { passive: true });
        elements.swipeArea.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Mouse events for testing
        elements.swipeArea.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Restart button
    elements.restartBtn.addEventListener('click', restartPoll);
}

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleMouseDown(e) {
    touchStartX = e.screenX;
}

function handleMouseUp(e) {
    touchEndX = e.screenX;
    handleSwipe();
}

function handleSwipe() {
    const distance = touchEndX - touchStartX;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    
    const activeCard = document.querySelector('.question-card.active');
    if (!activeCard) return;
    
    const nextBtn = activeCard.querySelector('.next-btn');
    if (!nextBtn.disabled && distance < 0) {
        goToNextQuestion(activeCard);
    }
}

// Restart poll
function restartPoll() {
    currentQuestionIndex = 0;
    answers = [];
    elements.completionScreen.classList.remove('active');
    elements.swipeHint.style.display = 'block';
    
    // Clear all question cards
    document.querySelectorAll('.question-card').forEach(card => card.remove());
    
    showQuestion(currentQuestionIndex);
}

// Helper functions
function escapeXML(str) {
    return str.replace(/[<>&'"]/g, c => 
        c === '<' ? '&lt;' :
        c === '>' ? '&gt;' :
        c === '&' ? '&amp;' :
        c === '\'' ? '&apos;' : '&quot;'
    );
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize
document.addEventListener('DOMContentLoaded', initPoll);

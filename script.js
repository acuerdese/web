// Poll configuration
const pollConfig = {
    title: "Modern Opinion Poll",
    shuffleQuestions: true,
    randomizeOptions: true,
    showProgress: true
};

// Animation types
const ENTRANCE_ANIMATIONS = ['slide-in-right', 'slide-in-left', 'zoom-in', 'flip-in'];
const EXIT_ANIMATIONS = ['slide-out-left', 'slide-out-right', 'zoom-out', 'fade-out'];

// DOM elements
const pollTitle = document.getElementById('poll-title');
const questionContainer = document.querySelector('.question-container');
const progressBar = document.querySelector('.progress-bar');
const completionScreen = document.querySelector('.completion-screen');
const restartBtn = document.querySelector('.restart-btn');

// Poll state
let currentQuestionIndex = 0;
let questions = [];
let answers = [];

// Load questions from XML
function loadQuestionsFromXML() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'questions.xml', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const xmlDoc = xhr.responseXML;
                    const questionNodes = xmlDoc.getElementsByTagName('question');
                    
                    questions = Array.from(questionNodes).map(node => {
                        const options = Array.from(node.getElementsByTagName('option')).map(opt => ({
                            text: opt.textContent,
                            value: opt.getAttribute('value') || opt.textContent
                        }));
                        
                        if (pollConfig.randomizeOptions) {
                            shuffleArray(options);
                        }
                        
                        return {
                            text: node.getElementsByTagName('text')[0].textContent,
                            options: options,
                            required: node.getAttribute('required') === 'true'
                        };
                    });
                    
                    if (pollConfig.shuffleQuestions) {
                        shuffleArray(questions);
                    }
                    
                    resolve();
                } else {
                    reject(new Error('Failed to load questions'));
                }
            }
        };
        xhr.send();
    });
}

// Initialize the poll
async function initPoll() {
    try {
        await loadQuestionsFromXML();
        pollTitle.textContent = pollConfig.title;
        showQuestion(currentQuestionIndex);
    } catch (error) {
        console.error('Error initializing poll:', error);
        questions = getFallbackQuestions();
        showQuestion(currentQuestionIndex);
    }
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
        },
        {
            text: "Which social media platform do you use most?",
            options: [
                { text: "Facebook", value: "facebook" },
                { text: "Instagram", value: "instagram" },
                { text: "Twitter", value: "twitter" },
                { text: "TikTok", value: "tiktok" },
                { text: "None", value: "none" }
            ],
            required: false
        }
    ];
}

// Show question with random animation
function showQuestion(index) {
    if (index >= questions.length) {
        completePoll();
        return;
    }
    
    const question = questions[index];
    const questionCards = document.querySelectorAll('.question-card');
    const activeCard = document.querySelector('.question-card.active');
    
    // Exit animation for current card
    if (activeCard) {
        const randomExitAnim = EXIT_ANIMATIONS[Math.floor(Math.random() * EXIT_ANIMATIONS.length)];
        activeCard.classList.remove('active');
        activeCard.classList.add(randomExitAnim);
        
        setTimeout(() => {
            activeCard.classList.remove(randomExitAnim);
            activeCard.style.display = 'none';
        }, 600);
    }
    
    // Create new card
    let card;
    if (questionCards.length > 1) {
        card = Array.from(questionCards).find(c => !c.classList.contains('active') && ![...EXIT_ANIMATIONS].some(anim => c.classList.contains(anim)));
        card.style.display = 'flex';
    } else {
        card = document.createElement('div');
        card.className = 'question-card';
        questionContainer.appendChild(card);
    }
    
    // Update progress
    if (pollConfig.showProgress) {
        progressBar.style.width = `${((index) / questions.length) * 100}%`;
    }
    
    // Set question content
    card.innerHTML = `
        <h2 class="question-text">${question.text}</h2>
        <div class="options-container"></div>
        <button class="next-btn" ${question.required ? 'disabled' : ''}>
            ${index === questions.length - 1 ? 'Submit Answers' : 'Continue'}
            <span class="arrow">→</span>
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
    
    // Activate with random animation
    setTimeout(() => {
        const randomEntranceAnim = ENTRANCE_ANIMATIONS[Math.floor(Math.random() * ENTRANCE_ANIMATIONS.length)];
        card.classList.add(randomEntranceAnim);
        
        setTimeout(() => {
            card.classList.remove(randomEntranceAnim);
            card.classList.add('active');
        }, 700);
        
        // Focus first option
        const firstOption = card.querySelector('.option-btn');
        if (firstOption) firstOption.focus();
    }, 50);
}

// Select an option
function selectOption(optionBtn, card) {
    card.querySelectorAll('.option-btn').forEach(opt => opt.classList.remove('selected'));
    optionBtn.classList.add('selected');
    
    const nextBtn = card.querySelector('.next-btn');
    if (nextBtn.disabled) nextBtn.disabled = false;
}

// Go to next question
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

// Complete the poll
function completePoll() {
    saveAnswersToXML();
    document.querySelector('.poll-container').classList.add('hidden');
    completionScreen.classList.remove('hidden');
}

// Save answers to XML
function saveAnswersToXML() {
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
    
    console.log('Submitting answers:', xmlString);
    // In real implementation: send to server
}

// Helper functions
function escapeXML(str) {
    return str.replace(/[<>&'"]/g, function(c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Event listeners
restartBtn.addEventListener('click', () => {
    currentQuestionIndex = 0;
    answers = [];
    document.querySelector('.poll-container').classList.remove('hidden');
    completionScreen.classList.add('hidden');
    showQuestion(currentQuestionIndex);
});

// Initialize
document.addEventListener('DOMContentLoaded', initPoll);

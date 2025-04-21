// Poll configuration
const pollConfig = {
    title: "Modern Opinion Poll",
    shuffleQuestions: true,
    randomizeOptions: true,
    showProgress: true
};

// DOM elements
const pollTitle = document.getElementById('poll-title');
const questionContainer = document.querySelector('.question-container');
const optionsContainer = document.querySelector('.options-container');
const nextBtn = document.querySelector('.next-btn');
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
        
        // Set poll title
        pollTitle.textContent = pollConfig.title;
        
        // Show first question
        showQuestion(currentQuestionIndex);
    } catch (error) {
        console.error('Error initializing poll:', error);
        // Fallback questions if XML fails to load
        questions = getFallbackQuestions();
        showQuestion(currentQuestionIndex);
    }
}

// Fallback questions if XML fails to load
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

// Show question by index
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
        activeCard.classList.remove('active');
        activeCard.classList.add('exiting');
        
        setTimeout(() => {
            activeCard.classList.remove('exiting');
            activeCard.style.display = 'none';
        }, 500);
    }
    
    // Create new card if needed
    let card;
    if (questionCards.length > 1) {
        card = Array.from(questionCards).find(c => !c.classList.contains('active') && !c.classList.contains('exiting'));
        card.style.display = 'block';
    } else {
        card = document.createElement('div');
        card.className = 'question-card';
        questionContainer.appendChild(card);
    }
    
    // Update progress bar
    if (pollConfig.showProgress) {
        const progress = ((index) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Set question text
    card.innerHTML = `
        <h2 class="question-text">${question.text}</h2>
        <div class="options-container"></div>
        <button class="next-btn" ${question.required ? 'disabled' : ''}>
            ${index === questions.length - 1 ? 'Submit' : 'Next'}
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
    
    // Add event listener to next button
    const nextBtn = card.querySelector('.next-btn');
    nextBtn.addEventListener('click', () => goToNextQuestion(card));
    
    // Activate new card with animation
    setTimeout(() => {
        card.classList.add('active');
    }, 50);
}

// Select an option
function selectOption(optionBtn, card) {
    const options = card.querySelectorAll('.option-btn');
    options.forEach(opt => opt.classList.remove('selected'));
    optionBtn.classList.add('selected');
    
    // Enable next button if required
    const nextBtn = card.querySelector('.next-btn');
    if (nextBtn.disabled) {
        nextBtn.disabled = false;
    }
}

// Go to next question
function goToNextQuestion(card) {
    // Save answer
    const selectedOption = card.querySelector('.option-btn.selected');
    const answer = {
        question: questions[currentQuestionIndex].text,
        answer: selectedOption ? selectedOption.dataset.value : 'skipped',
        timestamp: new Date().toISOString()
    };
    answers.push(answer);
    
    // Move to next question
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
}

// Complete the poll
function completePoll() {
    // Save all answers to XML
    saveAnswersToXML();
    
    // Hide poll and show completion screen
    document.querySelector('.poll-container').classList.add('hidden');
    completionScreen.classList.remove('hidden');
    
    // Add animation to completion screen
    completionScreen.style.animation = 'fadeIn 0.5s ease';
}

// Save answers to XML
function saveAnswersToXML() {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<submissions>
    <poll>
        <title>${pollConfig.title}</title>
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
    
    // In a real app, you would send this to a server
    // For this demo, we'll just log it and simulate a submission
    console.log('Submitting answers:', xmlString);
    
    // Simulate submission to submissions.xml
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'save_submission.php', true);
    xhr.setRequestHeader('Content-Type', 'application/xml');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log('Submission result:', xhr.status, xhr.responseText);
        }
    };
    // xhr.send(xmlString); // Uncomment in a real implementation
}

// Helper function to escape XML special characters
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

// Helper function to shuffle array
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

// Initialize the poll when DOM is loaded
document.addEventListener('DOMContentLoaded', initPoll);

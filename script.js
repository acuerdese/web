document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const pollContainer = document.querySelector('.poll-container');
    const questionContainer = document.querySelector('.question-container');
    const pollTitle = document.querySelector('.poll-title');
    const pollDescription = document.querySelector('.poll-description');
    const progressBar = document.querySelector('.progress');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    const submitButton = document.querySelector('.submit');
    const thankYouSection = document.querySelector('.thank-you');
    const thankYouMessage = document.querySelector('.thank-you-message');
    const restartButton = document.querySelector('.restart-button');
    
    // Poll data and state
    let pollData = {};
    let questions = [];
    let currentQuestionIndex = 0;
    let answers = {};
    
    // Load poll data from XML
    fetch('poll.xml')
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            pollData = parsePollData(data);
            questions = shuffleArray(pollData.questions);
            initializePoll();
        })
        .catch(error => {
            console.error('Error loading poll:', error);
            pollTitle.textContent = 'Error loading poll';
            pollDescription.textContent = 'Please try again later.';
        });
    
    // Parse XML data into JavaScript object
    function parsePollData(xml) {
        return {
            title: xml.querySelector('title').textContent,
            description: xml.querySelector('description').textContent,
            questions: Array.from(xml.querySelectorAll('question')).map(q => ({
                id: q.getAttribute('id'),
                type: q.getAttribute('type'),
                text: q.querySelector('text').textContent,
                options: q.getAttribute('type') === 'multiple' ? 
                    Array.from(q.querySelectorAll('option')).map(o => o.textContent) : null,
                placeholder: q.querySelector('placeholder')?.textContent,
                min: q.getAttribute('min'),
                max: q.getAttribute('max'),
                step: q.getAttribute('step')
            })),
            thankyou: {
                message: xml.querySelector('thankyou message').textContent,
                button: xml.querySelector('thankyou button').textContent
            }
        };
    }
    
    // Initialize the poll
    function initializePoll() {
        pollTitle.textContent = pollData.title;
        pollDescription.textContent = pollData.description;
        thankYouMessage.textContent = pollData.thankyou.message;
        restartButton.textContent = pollData.thankyou.button;
        
        showQuestion(currentQuestionIndex);
        updateProgress();
    }
    
    // Show a specific question
    function showQuestion(index) {
        if (index < 0 || index >= questions.length) return;
        
        currentQuestionIndex = index;
        const question = questions[index];
        
        // Clear previous question
        questionContainer.innerHTML = '';
        
        // Create question element based on type
        const questionEl = document.createElement('div');
        questionEl.className = 'question';
        
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = question.text;
        questionEl.appendChild(questionText);
        
        // Create appropriate input based on question type
        switch (question.type) {
            case 'multiple':
                createMultipleChoice(question, questionEl);
                break;
            case 'rating':
                createRatingScale(question, questionEl);
                break;
            case 'text':
                createTextInput(question, questionEl);
                break;
            case 'yesno':
                createYesNo(question, questionEl);
                break;
            case 'range':
                createRangeSlider(question, questionEl);
                break;
        }
        
        questionContainer.appendChild(questionEl);
        
        // Update navigation buttons
        prevButton.disabled = currentQuestionIndex === 0;
        nextButton.style.display = currentQuestionIndex === questions.length - 1 ? 'none' : 'block';
        submitButton.style.display = currentQuestionIndex === questions.length - 1 ? 'block' : 'none';
    }
    
    // Create multiple choice question
    function createMultipleChoice(question, container) {
        question.options.forEach((option, i) => {
            const optionId = `${question.id}_${i}`;
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = question.id;
            input.id = optionId;
            input.value = option;
            input.className = 'option-input';
            
            // Check if this option was previously selected
            if (answers[question.id] === option) {
                input.checked = true;
            }
            
            const label = document.createElement('label');
            label.htmlFor = optionId;
            label.className = 'option-label';
            label.textContent = option;
            
            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            container.appendChild(optionDiv);
        });
    }
    
    // Create rating scale question
    function createRatingScale(question, container) {
        const min = parseInt(question.min) || 1;
        const max = parseInt(question.max) || 10;
        
        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'rating-container';
        
        for (let i = min; i <= max; i++) {
            const ratingOption = document.createElement('div');
            ratingOption.className = answers[question.id] === i.toString() ? 
                'rating-option selected' : 'rating-option';
            ratingOption.textContent = i;
            ratingOption.dataset.value = i;
            
            ratingOption.addEventListener('click', function() {
                // Remove selected class from all options
                document.querySelectorAll('.rating-option').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                this.classList.add('selected');
                answers[question.id] = this.dataset.value;
            });
            
            ratingContainer.appendChild(ratingOption);
        }
        
        container.appendChild(ratingContainer);
    }
    
    // Create text input question
    function createTextInput(question, container) {
        const input = document.createElement('textarea');
        input.className = 'text-input';
        input.rows = 4;
        input.placeholder = question.placeholder || '';
        
        // Set previous answer if exists
        if (answers[question.id]) {
            input.value = answers[question.id];
        }
        
        input.addEventListener('input', function() {
            answers[question.id] = this.value;
        });
        
        container.appendChild(input);
    }
    
    // Create yes/no question
    function createYesNo(question, container) {
        const yesnoContainer = document.createElement('div');
        yesnoContainer.className = 'yesno-container';
        
        const yesButton = document.createElement('button');
        yesButton.className = answers[question.id] === 'yes' ? 
            'yesno-button selected' : 'yesno-button';
        yesButton.textContent = 'Yes';
        yesButton.dataset.value = 'yes';
        
        const noButton = document.createElement('button');
        noButton.className = answers[question.id] === 'no' ? 
            'yesno-button selected' : 'yesno-button';
        noButton.textContent = 'No';
        noButton.dataset.value = 'no';
        
        yesButton.addEventListener('click', function() {
            yesButton.classList.add('selected');
            noButton.classList.remove('selected');
            answers[question.id] = 'yes';
        });
        
        noButton.addEventListener('click', function() {
            noButton.classList.add('selected');
            yesButton.classList.remove('selected');
            answers[question.id] = 'no';
        });
        
        yesnoContainer.appendChild(yesButton);
        yesnoContainer.appendChild(noButton);
        container.appendChild(yesnoContainer);
    }
    
    // Create range slider question
    function createRangeSlider(question, container) {
        const min = parseInt(question.min) || 0;
        const max = parseInt(question.max) || 100;
        const step = parseInt(question.step) || 1;
        const defaultValue = Math.floor((max - min) / 2) + min;
        
        const rangeContainer = document.createElement('div');
        rangeContainer.className = 'range-container';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = answers[question.id] || defaultValue;
        slider.className = 'range-slider';
        
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'range-value';
        valueDisplay.textContent = slider.value;
        
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
            answers[question.id] = this.value;
        });
        
        // Set initial answer
        answers[question.id] = slider.value;
        
        rangeContainer.appendChild(slider);
        rangeContainer.appendChild(valueDisplay);
        container.appendChild(rangeContainer);
    }
    
    // Update progress bar
    function updateProgress() {
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Save answer for current question
    function saveCurrentAnswer() {
        const question = questions[currentQuestionIndex];
        
        switch (question.type) {
            case 'multiple':
                const selectedOption = document.querySelector(`input[name="${question.id}"]:checked`);
                if (selectedOption) {
                    answers[question.id] = selectedOption.value;
                }
                break;
            case 'text':
                // Already handled by input event listener
                break;
            // Other types are handled by their respective event listeners
        }
    }
    
    // Navigation functions
    function goToNextQuestion() {
        saveCurrentAnswer();
        
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
            updateProgress();
        }
    }
    
    function goToPrevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
            updateProgress();
        }
    }
    
    function submitPoll() {
        saveCurrentAnswer();
        
        // In a real app, you would send answers to a server here
        console.log('Poll submitted with answers:', answers);
        
        // Show thank you message
        document.querySelector('.poll-content').style.display = 'none';
        thankYouSection.style.display = 'block';
    }
    
    function restartPoll() {
        // Reset state
        currentQuestionIndex = 0;
        answers = {};
        
        // Show first question
        document.querySelector('.poll-content').style.display = 'block';
        thankYouSection.style.display = 'none';
        
        // Shuffle questions again if desired
        questions = shuffleArray(pollData.questions);
        
        showQuestion(currentQuestionIndex);
        updateProgress();
    }
    
    // Event listeners
    nextButton.addEventListener('click', goToNextQuestion);
    prevButton.addEventListener('click', goToPrevQuestion);
    submitButton.addEventListener('click', submitPoll);
    restartButton.addEventListener('click', restartPoll);
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && currentQuestionIndex < questions.length - 1) {
            goToNextQuestion();
        } else if (e.key === 'Enter' && currentQuestionIndex === questions.length - 1) {
            submitPoll();
        } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
            goToPrevQuestion();
        } else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
            goToNextQuestion();
        }
    });
    
    // Utility function to shuffle array
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
});

// Update the showQuestion function to ensure proper scrolling
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
        card.style.display = 'flex'; // Changed to flex
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
        optionBtn.addEventListener('click', () => {
            selectOption(optionBtn, card);
            // Smooth scroll to keep selected option in view
            optionBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        optionsContainer.appendChild(optionBtn);
    });
    
    // Add event listener to next button
    const nextBtn = card.querySelector('.next-btn');
    nextBtn.addEventListener('click', () => goToNextQuestion(card));
    
    // Activate new card with animation
    setTimeout(() => {
        card.classList.add('active');
        
        // Focus on the first option for keyboard accessibility
        const firstOption = card.querySelector('.option-btn');
        if (firstOption) {
            firstOption.focus();
        }
    }, 50);
    
    // Add keyboard navigation for options
    card.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const options = card.querySelectorAll('.option-btn');
            const currentIndex = Array.from(options).findIndex(opt => opt === document.activeElement);
            
            if (currentIndex >= 0) {
                e.preventDefault();
                let nextIndex;
                
                if (e.key === 'ArrowDown') {
                    nextIndex = (currentIndex + 1) % options.length;
                } else {
                    nextIndex = (currentIndex - 1 + options.length) % options.length;
                }
                
                options[nextIndex].focus();
                options[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else if (e.key === 'Enter' && document.activeElement.classList.contains('option-btn')) {
            selectOption(document.activeElement, card);
            const nextBtn = card.querySelector('.next-btn');
            if (!nextBtn.disabled) {
                nextBtn.focus();
            }
        }
    });
}

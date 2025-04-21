// Add these variables at the top
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels

// Add this after DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initPoll();
    initSwipe();
});

// Add this new function
function initSwipe() {
    const swipeArea = document.getElementById('swipe-area');
    
    swipeArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    swipeArea.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    // Mouse events for desktop testing
    swipeArea.addEventListener('mousedown', (e) => {
        touchStartX = e.screenX;
        document.addEventListener('mouseup', handleMouseUp);
    });
}

function handleMouseUp(e) {
    touchEndX = e.screenX;
    handleSwipe();
    document.removeEventListener('mouseup', handleMouseUp);
}

function handleSwipe() {
    const distance = touchEndX - touchStartX;
    
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    
    const activeCard = document.querySelector('.question-card.active');
    if (!activeCard) return;
    
    const nextBtn = activeCard.querySelector('.next-btn');
    if (!nextBtn.disabled) {
        if (distance < 0 && touchStartX !== 0) {
            // Swipe left - next question
            goToNextQuestion(activeCard);
        } else if (distance > 0 && currentQuestionIndex > 0) {
            // Swipe right - previous question (optional)
            // currentQuestionIndex--;
            // showQuestion(currentQuestionIndex);
        }
    }
}

// Update the showQuestion function to hide swipe hint on last question
function showQuestion(index) {
    // ... existing code ...
    
    // Hide swipe hint on last question
    const swipeHint = document.querySelector('.swipe-hint');
    if (swipeHint) {
        swipeHint.style.display = index >= questions.length - 1 ? 'none' : 'block';
    }
    
    // ... rest of existing code ...
}

// Update the completePoll function to hide swipe hint
function completePoll() {
    const swipeHint = document.querySelector('.swipe-hint');
    if (swipeHint) swipeHint.style.display = 'none';
    // ... rest of existing code ...
}

// Update the restart button event listener to show swipe hint again
restartBtn.addEventListener('click', () => {
    // ... existing code ...
    const swipeHint = document.querySelector('.swipe-hint');
    if (swipeHint) swipeHint.style.display = 'block';
});

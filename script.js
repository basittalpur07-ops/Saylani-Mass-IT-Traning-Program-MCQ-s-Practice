// Global Variables
let currentTest = null;
let currentQuestionIndex = 0;
let selectedAnswers = [];
let testTimer = null;
let timeRemaining = 9000; // 5 minutes default
let warningCount = 0;
let isTestActive = false;
let mcqData = {};
let shuffledQuestions = [];

// Sample MCQ Data (you'll replace this with your JSON file)
const sampleMCQData = {
    "iq": [
        {
            "id": 1,
            "question": "If in a certain code, MEAT is written as AEMT, how would TEAM be written?",
            "options": ["AEMT", "ETAM", "MAET", "ATEM"],
            "correct": 3,
            "explanation": "The pattern is: first letter goes to 4th position, second to 1st, third to 3rd, fourth to 2nd. So TEAM becomes ATEM."
        },
        {
            "id": 2,
            "question": "Find the missing number: 2, 6, 12, 20, 30, ?",
            "options": ["40", "42", "45", "48"],
            "correct": 1,
            "explanation": "Pattern: n(n+1) where n=1,2,3,4,5,6. So 6(6+1) = 42."
        },
        {
            "id": 3,
            "question": "A man walks 5 km north, then 3 km east, then 5 km south. How far is he from his starting point?",
            "options": ["3 km", "5 km", "8 km", "13 km"],
            "correct": 0,
            "explanation": "He ends up 3 km east of his starting point, forming a straight line distance of 3 km."
        }
    ],
    "computer": [
        {
            "id": 1,
            "question": "What does CPU stand for?",
            "options": ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Computer Processing Unit"],
            "correct": 0,
            "explanation": "CPU stands for Central Processing Unit, which is the main component that executes instructions."
        },
        {
            "id": 2,
            "question": "Which of the following is not an operating system?",
            "options": ["Windows", "Linux", "Microsoft Word", "macOS"],
            "correct": 2,
            "explanation": "Microsoft Word is an application software, not an operating system."
        }
    ],
    "math": [
        {
            "id": 1,
            "question": "What is 15% of 200?",
            "options": ["25", "30", "35", "40"],
            "correct": 1,
            "explanation": "15% of 200 = (15/100) × 200 = 30"
        },
        {
            "id": 2,
            "question": "If x + 5 = 12, what is x?",
            "options": ["5", "6", "7", "8"],
            "correct": 2,
            "explanation": "x + 5 = 12, so x = 12 - 5 = 7"
        }
    ],
    "islamiat": [
        {
            "id": 1,
            "question": "How many pillars of Islam are there?",
            "options": ["4", "5", "6", "7"],
            "correct": 1,
            "explanation": "There are 5 pillars of Islam: Shahada, Salah, Zakat, Sawm, and Hajj."
        }
    ],
    "general": [
        {
            "id": 1,
            "question": "What is the capital of Pakistan?",
            "options": ["Karachi", "Lahore", "Islamabad", "Peshawar"],
            "correct": 2,
            "explanation": "Islamabad is the capital city of Pakistan."
        }
    ],
    "english": [
        {
            "id": 1,
            "question": "Choose the correct spelling:",
            "options": ["Recieve", "Receive", "Receve", "Receeve"],
            "correct": 1,
            "explanation": "The correct spelling is 'Receive' - remember 'i before e except after c'."
        }
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadMCQData();
});

function initializeApp() {
    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

function setupEventListeners() {
    // Fullscreen change event
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Prevent right-click during test
    document.addEventListener('contextmenu', function(e) {
        if (isTestActive) {
            e.preventDefault();
        }
    });

    // Prevent certain key combinations during test
    document.addEventListener('keydown', function(e) {
        if (isTestActive) {
            // Prevent F12, Ctrl+Shift+I, Ctrl+U, etc.
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                e.key === 'F5' ||
                (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                showWarning('Keyboard shortcuts are disabled during the test!');
            }
        }
    });

    // FAQ toggle functionality
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isActive = answer.classList.contains('active');
            
            // Close all other answers
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.classList.remove('active');
            });
            
            // Toggle current answer
            if (!isActive) {
                answer.classList.add('active');
            }
        });
    });
}

async function loadMCQData() {
    try {
        // Try to load from external JSON file
        const response = await fetch('mcqs.json');
        if (response.ok) {
            mcqData = await response.json();
        } else {
            throw new Error('Could not load MCQ data');
        }
    } catch (error) {
        console.log('Using sample data:', error.message);
        // Use sample data if JSON file is not available
        mcqData = sampleMCQData;
    }
}

function startTest(subject) {
    if (!mcqData[subject] || mcqData[subject].length === 0) {
        alert('No questions available for this subject. Please try another subject.');
        return;
    }

    currentTest = subject;
    currentQuestionIndex = 0;
    selectedAnswers = [];
    warningCount = 0;
    isTestActive = true;
    timeRemaining = 9000; // 5 minutes

    // Shuffle questions and options
    shuffledQuestions = shuffleArray([...mcqData[subject]]);
    shuffledQuestions.forEach(question => {
        const correctAnswer = question.options[question.correct];
        question.options = shuffleArray([...question.options]);
        question.correct = question.options.indexOf(correctAnswer);
    });

    // Initialize selected answers array
    selectedAnswers = new Array(shuffledQuestions.length).fill(null);

    // Enter fullscreen
    enterFullscreen();
    
    // Show test interface
    document.getElementById('mcq-interface').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Update subject title
    document.getElementById('subject-title').textContent = getSubjectDisplayName(subject);
    document.getElementById('total-questions').textContent = shuffledQuestions.length;

    // Start timer
    startTimer();

    // Load first question
    loadQuestion();
}

function getSubjectDisplayName(subject) {
    const displayNames = {
        'iq': 'IQ Test',
        'computer': 'Computer Science',
        'math': 'Mathematics',
        'islamiat': 'Islamiat',
        'general': 'General Knowledge',
        'english': 'English'
    };
    return displayNames[subject] || subject.toUpperCase();
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement);

    if (isTestActive && !isFullscreen) {
        warningCount++;
        showWarning(`You have exited full-screen mode. Warning ${warningCount}/3`);
        
        if (warningCount >= 3) {
            failTest('You have exceeded the maximum number of warnings (3). Test cancelled.');
        }
    }
}

function showWarning(message) {
    document.getElementById('warning-message').textContent = message;
    document.getElementById('warning-count').textContent = warningCount;
    document.getElementById('warning-modal').classList.remove('hidden');
}

function returnToFullscreen() {
    document.getElementById('warning-modal').classList.add('hidden');
    enterFullscreen();
}

function cancelTest() {
    document.getElementById('warning-modal').classList.add('hidden');
    exitTest();
}

function failTest(reason) {
    isTestActive = false;
    clearInterval(testTimer);
    exitFullscreen();
    
    alert(reason + ' You have failed the test.');
    
    document.getElementById('mcq-interface').classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Reset test state
    resetTestState();
}

function startTimer() {
    const timerDisplay = document.getElementById('timer-display');
    
    testTimer = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is running out
        if (timeRemaining <= 60) {
            timerDisplay.style.color = '#ef4444';
        } else if (timeRemaining <= 120) {
            timerDisplay.style.color = '#f59e0b';
        }
        
        if (timeRemaining <= 0) {
            clearInterval(testTimer);
            submitTest();
        }
    }, 1000);
}

function loadQuestion() {
    const question = shuffledQuestions[currentQuestionIndex];
    
    // Update question counter
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    
    // Update question text
    document.getElementById('question-text').textContent = question.question;
    
    // Update options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
        optionBtn.onclick = () => selectOption(index);
        
        // Restore previous selection
        if (selectedAnswers[currentQuestionIndex] === index) {
            optionBtn.classList.add('selected');
        }
        
        optionsContainer.appendChild(optionBtn);
    });
    
    // Update navigation buttons
    updateNavigationButtons();
}

function selectOption(optionIndex) {
    // Remove previous selection
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked option
    document.querySelectorAll('.option-btn')[optionIndex].classList.add('selected');
    
    // Store selection
    selectedAnswers[currentQuestionIndex] = optionIndex;
    
    // Update navigation buttons
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // Previous button
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // Next/Submit button logic
    const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
    
    if (isLastQuestion) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function submitTest() {
    if (!confirm('Are you sure you want to submit the test? You cannot change your answers after submission.')) {
        return;
    }
    
    isTestActive = false;
    clearInterval(testTimer);
    exitFullscreen();
    
    // Calculate results
    calculateResults();
}

function calculateResults() {
    let correctCount = 0;
    let wrongCount = 0;
    const results = [];
    
    shuffledQuestions.forEach((question, index) => {
        const userAnswer = selectedAnswers[index];
        const isCorrect = userAnswer === question.correct;
        
        if (userAnswer !== null) {
            if (isCorrect) {
                correctCount++;
            } else {
                wrongCount++;
            }
        } else {
            wrongCount++; // Count unanswered as wrong
        }
        
        results.push({
            question: question.question,
            userAnswer: userAnswer !== null ? question.options[userAnswer] : 'Not answered',
            correctAnswer: question.options[question.correct],
            isCorrect: isCorrect,
            explanation: question.explanation
        });
    });
    
    const totalQuestions = shuffledQuestions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    showResults(correctCount, wrongCount, totalQuestions, percentage, results);
}

function showResults(correct, wrong, total, percentage, detailedResults) {
    // Update score circle
    const scoreCircle = document.querySelector('.score-circle');
    const scorePercentage = document.getElementById('score-percentage');
    
    scorePercentage.textContent = `${percentage}%`;
    
    // Update score circle color based on percentage
    let color = '#ef4444'; // Red for low scores
    if (percentage >= 80) color = '#10b981'; // Green for high scores
    else if (percentage >= 60) color = '#f59e0b'; // Yellow for medium scores
    
    scoreCircle.style.background = `conic-gradient(${color} ${percentage * 3.6}deg, #e5e7eb ${percentage * 3.6}deg)`;
    
    // Update counts
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('wrong-count').textContent = wrong;
    document.getElementById('total-count').textContent = total;
    
    // Show detailed results
    const detailedResultsContainer = document.getElementById('detailed-results');
    detailedResultsContainer.innerHTML = '';
    
    detailedResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.isCorrect ? 'correct' : 'wrong'}`;
        
        resultItem.innerHTML = `
            <div class="result-question">Q${index + 1}: ${result.question}</div>
            <div class="result-answer">
                <strong>Your Answer:</strong> ${result.userAnswer}<br>
                <strong>Correct Answer:</strong> ${result.correctAnswer}<br>
                <strong>Explanation:</strong> ${result.explanation}
            </div>
        `;
        
        detailedResultsContainer.appendChild(resultItem);
    });
    
    // Hide test interface and show results
    document.getElementById('mcq-interface').classList.add('hidden');
    document.getElementById('results-modal').classList.remove('hidden');
    document.body.style.overflow = 'auto';
}

function closeResults() {
    document.getElementById('results-modal').classList.add('hidden');
    resetTestState();
}

function retakeTest() {
    document.getElementById('results-modal').classList.add('hidden');
    if (currentTest) {
        startTest(currentTest);
    }
}

function exitTest() {
    if (isTestActive) {
        if (!confirm('Are you sure you want to exit the test? Your progress will be lost.')) {
            return;
        }
    }
    
    isTestActive = false;
    clearInterval(testTimer);
    exitFullscreen();
    
    document.getElementById('mcq-interface').classList.add('hidden');
    document.getElementById('warning-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    resetTestState();
}

function resetTestState() {
    currentTest = null;
    currentQuestionIndex = 0;
    selectedAnswers = [];
    warningCount = 0;
    timeRemaining = 9000;
    shuffledQuestions = [];
    
    // Reset timer display
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.textContent = '20:30:00';
        timerDisplay.style.color = 'white';
    }
}

// Contact form functionality
function submitContactForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Simulate form submission
    alert(`Thank you ${name}! Your message has been received. We'll get back to you at ${email} soon.`);
    
    // Reset form
    event.target.reset();
}

// Utility functions for animations and effects
function animateOnScroll() {
    const elements = document.querySelectorAll('.subject-card, .feature-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

// Initialize scroll animations when DOM is loaded
document.addEventListener('DOMContentLoaded', animateOnScroll);

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation for better UX
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 1.2rem;
        ">
            <div>
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <div>Loading test...</div>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
    
    setTimeout(() => {
        const loaderElement = document.getElementById('loader');
        if (loaderElement) {
            loaderElement.remove();
        }
    }, 1500);
}

// Performance optimization: Lazy load images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// Add keyboard navigation for better accessibility
document.addEventListener('keydown', function(e) {
    if (!isTestActive) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (!document.getElementById('prev-btn').disabled) {
                previousQuestion();
            }
            break;
        case 'ArrowRight':
            if (currentQuestionIndex < shuffledQuestions.length - 1) {
                nextQuestion();
            }
            break;
        case '1':
        case '2':
        case '3':
        case '4':
            const optionIndex = parseInt(e.key) - 1;
            const options = document.querySelectorAll('.option-btn');
            if (options[optionIndex]) {
                selectOption(optionIndex);
            }
            break;
        case 'Enter':
            if (currentQuestionIndex === shuffledQuestions.length - 1) {
                submitTest();
            } else {
                nextQuestion();
            }
            break;
    }
});

// Add progress indicator
function updateProgressBar() {
    const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
    let progressBar = document.getElementById('progress-bar');
    
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 4px;
            background: #10b981;
            transition: width 0.3s ease;
            z-index: 2001;
        `;
        document.body.appendChild(progressBar);
    }
    
    progressBar.style.width = `${progress}%`;
}

// Update the loadQuestion function to include progress bar
const originalLoadQuestion = loadQuestion;
loadQuestion = function() {
    originalLoadQuestion();
    if (isTestActive) {
        updateProgressBar();
    }
};

// Clean up progress bar when test ends
const originalExitTest = exitTest;
exitTest = function() {
    originalExitTest();
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.remove();
    }
};

console.log('Saylani Entry Test Practice - Script loaded successfully!');
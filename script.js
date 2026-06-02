
let currentQuestionIndex = 0;
let quizQuestions = [];
let score = 0;
let nextButton = document.querySelector('.next');
const hidemainDiv = document.querySelector(".hidemain");
const mainDiv = document.querySelector(".main");
const containerDiv = document.querySelector(".container");
const inputText = document.querySelector(".inputtext");
const mcqNumberElement = document.querySelector('.mcqnumber h5');
const questionElement = document.querySelector('.question p');
const optionsContainer = document.querySelector('.options');


let loadingSpinner = null;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
    const num = parseInt(inputText.value);

    if (isNaN(num) || num < 1 || num > 50) {
        Swal.fire({
            title: "Invalid Input",
            text: "Number of questions must be between 1 and 50.",
            icon: "error"
        });
        return;
    }

    if (loadingSpinner) {
        console.warn("Quiz already starting or loading. Please wait.");
        return;
    }

    hidemainDiv.style.display = "none";

    loadingSpinner = document.createElement("div");
    loadingSpinner.classList.add("tempelem");
    loadingSpinner.innerHTML = '<div class="spinner" aria-hidden="true"></div><div class="loading-text">The questions are being fetched...</div>';
    document.body.appendChild(loadingSpinner);

    try {
        await delay(5000);

        const quizData = await fetchdata(num);

        console.log("Successfully fetched quiz data:", quizData);
        mainDiv.style.display = "flex";
        containerDiv.style.display = "flex";
        renderContent(quizData);

    } catch (error) {
        console.error("Quiz startup process failed:", error);
        mainDiv.style.display = "none";
        containerDiv.style.display = "none";
        hidemainDiv.style.display = "flex";
    } finally {
        if (loadingSpinner && loadingSpinner.parentNode) {
            loadingSpinner.remove();
            loadingSpinner = null;
        }
    }
}

async function fetchdata(amount) {
    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=${amount}&category=18&type=multiple`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const json_data = await response.json();

        if (json_data.response_code !== 0) {
            let apiErrorMessage = `API error: ${json_data.response_code}. `;
            if (json_data.response_code === 1) {
                apiErrorMessage += "No results could be returned for your query (try different amount).";
            } else if (json_data.response_code === 2) {
                apiErrorMessage += "Invalid parameter (amount or type issue).";
            } else if (json_data.response_code === 3) {
                apiErrorMessage += "Token Not Found (Session Token does not exist).";
            } else if (json_data.response_code === 4) {
                apiErrorMessage += "Token Empty (Session Token has returned all possible questions for the specified query).";
            }
            throw new Error(apiErrorMessage);
        }

        return json_data.results;

    } catch (error) {
        console.error("Fetchdata specific error:", error);
        Swal.fire({
            title: "Failed to load quiz data",
            text: `Details: ${error.message || 'Unknown error'}`,
            icon: "error"
        });
        throw error;
    } finally {
    }
}
function renderContent(qd) {
    quizQuestions = qd;
    currentQuestionIndex = 0;
    score = 0;
    nextButton.addEventListener('click', goToNextQuestion);
    nextButton.style.display = 'none';
    displayQuestion();
}
function displayQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        endQuiz()
    }
    const questionData = quizQuestions[currentQuestionIndex]
    mcqNumberElement.textContent = `Question ${currentQuestionIndex + 1}`
    questionElement.innerHTML = decodeHtml(questionData.question);
    optionsContainer.innerHTML = '';
    const options = prepareOptions(questionData);
    options.forEach((optionText, index )=> {
        const optionDiv = document.createElement("div")
        optionDiv.classList.add('option')
        const p = document.createElement('p')
        p.innerHTML = `<span>${index + 1}.</span> ${decodeHtml(optionText)}`
        optionDiv.appendChild(p);
        optionDiv.addEventListener('click', () => {
            handleOptionClick(optionDiv, optionText, questionData.correct_answer)
        })
        optionsContainer.appendChild(optionDiv);

    });
    if (nextButton) {
        nextButton.style.display = 'none'

    }
    containerDiv.dataset.answered = 'false'
}
function handleOptionClick(clickedOptionDiv, selectedAnswer, correctAnswer) {
    if (containerDiv.dataset.answered === 'true') {
        return;
    }
    containerDiv.dataset.answered = 'true';
    Array.from(optionsContainer.children).forEach(option => {
        option.style.pointerEvents = 'none';
    });
    if (selectedAnswer === correctAnswer) {
        clickedOptionDiv.style.backgroundColor = '#d4edda';
        clickedOptionDiv.style.borderColor = '#28a745';
        score++;
    } else {
        clickedOptionDiv.style.backgroundColor = '#f8d7da';
        clickedOptionDiv.style.borderColor = '#dc3545';
        Array.from(optionsContainer.children).forEach(option => {
            const optionTextContent = decodeHtml(option.querySelector('p').textContent.replace(/^\d+\.\s*/, '').trim());
            if (optionTextContent === correctAnswer) {
                option.style.backgroundColor = '#d4edda';
                option.style.borderColor = '#28a745';
            }
        });
    }
    if (nextButton) {
        nextButton.style.display = 'block';
    }
}
function goToNextQuestion() {
    currentQuestionIndex++;
    if (nextButton) {
        nextButton.style.display = 'none';
    }
    displayQuestion();
}
function endQuiz(){
    containerDiv.innerHTML = `<div class="end-screen">
        <h2 class="end-title">Quiz Finished</h2>
        <p class="end-score">Your final score: ${score} out of ${quizQuestions.length}</p>
        <button class="restart-end" onclick="restartQuiz()">Restart Quiz</button>
    </div>`
}
function restartQuiz() {
    location.reload();
}
function decodeHtml(html) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = html;
    return textArea.value;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function prepareOptions(questionData) {
    const allOptions = [
        questionData.correct_answer,
        ...questionData.incorrect_answers
    ];
    return shuffleArray(allOptions);
}

// script.js - Combined data, routing, UI, and application logic

(function () { // IIFE to encapsulate scope
    'use strict';

    // --- DOM Elements ---
    const navbarContainer = document.getElementById('navbar');
    const viewContainer = document.getElementById('view-container');
    const modalRoot = document.getElementById('modal-root');

    // --- Application State ---
    const state = {
        availableTopics: ['chemistry', 'biology', 'tech'], // File-based topics
        currentTopic: null, // Can be filename stem or custom topic name
        currentDifficulty: 'all', // 'easy', 'medium', 'hard', 'all'
        randomize: true,
        fullDeck: [],         // Questions for the selected standard topic
        customDeck: null,     // Question array from parsed/selected custom JSON
        filteredDeck: [],     // Questions filtered by difficulty (from fullDeck or customDeck)
        currentIndex: 0,
        answers: [],          // { questionId, selectedAnswerIndex, correctAnswerIndex, isCorrect, responseTime }
        startTime: null,
        history: [],          // { id, date, topic, difficulty, score, ... }
        savedCustomQuizzes: {}, // Loaded from localStorage: { "Topic Name": {topic, questions}, ... }
    };

    const HISTORY_STORAGE_KEY = 'quizAppHistory_Simple_v2';
    const CUSTOM_QUIZZES_STORAGE_KEY = 'quizAppCustomQuizzes_v1'; // Key for saved custom quizzes

    // --- Data Loading & Handling ---

    /** Loads quiz deck from file */
    async function loadDeckFromFile(topic) {
        // ... (no changes from previous version) ...
        if (!topic || typeof topic !== 'string') {
            return Promise.reject(new Error('Topic must be provided as a string.'));
        }
        const filePath = `./data/${topic.toLowerCase()}.json`; // Path relative to index.html
        console.log(`[Data] Fetching deck from file: ${filePath}`);
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - Could not load ${filePath}`);
            }
            const deck = await response.json();
            validateDeckStructure(deck, `File: ${topic}.json`); // Validate the array
            console.log(`[Data] Deck loaded from ${topic}. Questions: ${deck.length}`);
            return deck;
        } catch (error) {
            console.error(`[Data] Failed to load or parse deck from ${filePath}:`, error);
            throw error;
        }
    }

    /** Validates question array structure */
    function validateDeckStructure(questionsArray, sourceName = "Deck") {
        // ... (no changes from previous version) ...
        if (!Array.isArray(questionsArray)) {
            throw new Error(`Invalid structure in ${sourceName}: Expected an array of questions.`);
        }
        if (questionsArray.length === 0) {
            console.warn(`[Validation] Questions array from ${sourceName} is empty.`);
            return; // Empty array is valid
        }
        const firstQuestion = questionsArray[0];
        const requiredKeys = ['id', 'question', 'choices', 'answerIndex', 'difficulty'];
        const missingKeys = requiredKeys.filter(key => !(key in firstQuestion));

        if (missingKeys.length > 0) {
            throw new Error(`Invalid structure in ${sourceName}: Questions missing required keys: ${missingKeys.join(', ')}`);
        }
        if (!Array.isArray(firstQuestion.choices)) {
            throw new Error(`Invalid structure in ${sourceName}: 'choices' must be an array.`);
        }
        if (typeof firstQuestion.answerIndex !== 'number') {
            throw new Error(`Invalid structure in ${sourceName}: 'answerIndex' must be a number.`);
        }
        if (typeof firstQuestion.difficulty !== 'string' || !['easy', 'medium', 'hard'].includes(firstQuestion.difficulty.toLowerCase())) {
            console.warn(`[Validation] Question ID ${firstQuestion.id} in ${sourceName} has non-standard difficulty: '${firstQuestion.difficulty}'. Expected 'easy', 'medium', or 'hard'.`);
        }
    }


    /** Shuffles an array (Fisher-Yates) */
    function shuffle(array) {
        // ... (no changes from previous version) ...
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    /** Filters source deck and updates state.filteredDeck */
    function filterAndPrepareDeck() {
        // ... (no changes from previous version) ...
        const sourceDeck = state.customDeck || state.fullDeck;
        if (!sourceDeck || sourceDeck.length === 0) {
            console.warn("[Quiz Prep] Source deck (questions array) is empty or not loaded.");
            state.filteredDeck = [];
            state.currentIndex = 0;
            state.answers = [];
            return;
        }
        let deck = [...sourceDeck];
        if (state.currentDifficulty !== 'all') {
            deck = deck.filter(q => q.difficulty && q.difficulty.toLowerCase() === state.currentDifficulty);
        }
        state.filteredDeck = state.randomize ? shuffle(deck) : deck;
        state.currentIndex = 0;
        state.answers = [];
        console.log(`[Quiz Prep] Topic: ${state.currentTopic}, Difficulty Filter: ${state.currentDifficulty}, Random: ${state.randomize}. Source size: ${sourceDeck.length}, Filtered size: ${state.filteredDeck.length}`);
    }


    // --- Routing ---
    function handleRouteChange() {
        // ... (no changes from previous version regarding clearing state) ...
        const hash = location.hash || '#/home';
        console.log(`[Router] Navigating to ${hash}`);
        if (!hash.startsWith('#/quiz') && !hash.startsWith('#/results') && !hash.startsWith('#/solutions')) {
            state.customDeck = null;
            state.fullDeck = [];
            state.currentTopic = null;
            console.log("[State] Cleared decks and topic on navigation.");
        }
        viewContainer.innerHTML = '<p>Loading...</p>';
        if (hash === '#/home') {
            renderHomeView();
        } else if (hash === '#/quiz') {
            renderQuizView();
        } else if (hash.startsWith('#/results')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            renderResultsView(params.get('id'));
        } else if (hash.startsWith('#/solutions/')) {
            const entryId = hash.substring('#/solutions/'.length);
            renderSolutionsView(entryId);
        } else if (hash === '#/analytics') {
            renderAnalyticsView();
        }
        else {
            console.warn(`[Router] Unknown route: ${hash}. Redirecting to home.`);
            location.hash = '#/home'; // Default fallback
        }
        renderNavbar(hash);
        window.scrollTo(0, 0);
    }

    // --- UI Rendering ---

    /** Render the navigation bar */
    function renderNavbar(currentHash) {
        // ... (no changes from previous version) ...
        navbarContainer.innerHTML = `
          <a href="#/home" class="logo">QuizApp ✨</a>
          <nav>
            <ul>
              <li><a href="#/home" class="${currentHash === '#/home' ? 'active' : ''}">Home</a></li>
              <li><a href="#/analytics" class="${currentHash === '#/analytics' ? 'active' : ''}">Analytics</a></li>
            </ul>
          </nav>
        `;
    }

    /** Render the home/setup screen - **Updated for Saved Custom Quizzes** */
    function renderHomeView() {
        // AI Prompt Text
        const aiPrompt = `Generate a JSON object for a QuizApp. The JSON object must have exactly two top-level keys:
  1.  "topic": A string representing the name of the quiz topic (e.g., "World Capitals", "Famous Scientists").
  2.  "questions": An array of question objects.
  
  Each question object in the "questions" array must have the following keys:
  - "id": A unique number or string for the question.
  - "question": The question text (string).
  - "choices": An array of strings representing the answer options (usually 4).
  - "answerIndex": The zero-based index (number) of the correct answer within the "choices" array.
  - "difficulty": A string, either "easy", "medium", or "hard".
  - "hint": (Optional) A short hint text (string).
  - "explanation": (Optional) A brief explanation for the answer (string).
  - "imagePath": (Optional) A URL or relative path for an image (string). Leave empty "" if no image.
  
  Make sure the entire output is a single valid JSON object starting with { and ending with }. Do not include any text before or after the JSON object. Ensure commas are used correctly between elements/properties and NOT after the last one.
  Generate [NUMBER] questions about [YOUR TOPIC HERE].`;

        // --- NEW: Generate options for saved custom quizzes ---
        const savedQuizTopics = Object.keys(state.savedCustomQuizzes);
        let savedQuizOptionsHtml = '<option value="" disabled selected>-- Select Saved Quiz --</option>';
        if (savedQuizTopics.length > 0) {
            savedQuizOptionsHtml += savedQuizTopics.map(topic =>
                `<option value="${topic}">${topic}</option>`
            ).join('');
        } else {
            savedQuizOptionsHtml = '<option value="" disabled selected>-- No saved custom quizzes --</option>';
        }
        // --- End NEW ---

        viewContainer.innerHTML = `
           <div class="view home-view">
             <h1 class="text-center">Welcome to QuizApp! 🚀</h1>
  
             <form id="quiz-setup-form" class="card">
                 <h2 class="card-header">Start Quiz from Topic</h2>
                 <div class="card-content">
                     <div class="form-group">
                         <label for="topic-select">📚 Topic:</label>
                         <select id="topic-select" required>
                             <option value="" disabled selected>-- Select Topic --</option>
                             ${state.availableTopics.map(topic =>
            `<option value="${topic}">${topic.charAt(0).toUpperCase() + topic.slice(1)}</option>`
        ).join('')}
                         </select>
                     </div>
                     <div class="form-group">
                         <label for="difficulty-select">📊 Difficulty:</label>
                         <select id="difficulty-select">
                             <option value="all">All</option>
                             <option value="easy">Easy</option>
                             <option value="medium">Medium</option>
                             <option value="hard">Hard</option>
                         </select>
                     </div>
                     <div class="form-group">
                         <input type="checkbox" id="randomize-checkbox" checked>
                         <label for="randomize-checkbox" class="inline-label">🔀 Randomize Questions</label>
                     </div>
                     <button type="submit" class="btn">Start Topic Quiz</button>
                 </div>
             </form>
  
             <div class="card custom-quiz-section">
                 <h2 class="card-header">Custom Quiz Options</h2>
                 <div class="card-content">
  
                      <div class="saved-quiz-loader">
                          <h3>Load Saved Custom Quiz</h3>
                          <div class="form-group">
                              <label for="saved-custom-topic-select">💾 Saved Quizzes:</label>
                              <select id="saved-custom-topic-select" ${savedQuizTopics.length === 0 ? 'disabled' : ''}>
                                  ${savedQuizOptionsHtml}
                              </select>
                          </div>
                           <div class="form-group">
                             <label for="saved-custom-difficulty-select">📊 Filter by Difficulty:</label>
                             <select id="saved-custom-difficulty-select">
                                 <option value="all">All</option>
                                 <option value="easy">Easy</option>
                                 <option value="medium">Medium</option>
                                 <option value="hard">Hard</option>
                             </select>
                         </div>
                         <div class="form-group">
                             <input type="checkbox" id="saved-custom-randomize-checkbox" checked>
                             <label for="saved-custom-randomize-checkbox" class="inline-label">🔀 Randomize Questions</label>
                         </div>
                          <button type="button" id="start-saved-custom-btn" class="btn" ${savedQuizTopics.length === 0 ? 'disabled' : ''}>Start Saved Quiz</button>
                          <hr style="margin: var(--spacing-lg) 0; border-color: var(--border-color);">
                      </div>
                      <h3>Create New Custom Quiz</h3>
                     <p>Paste your questions below in the required JSON format (including a top-level "topic" key).</p>
                      <div class="form-group">
                         <label for="custom-json-input">📋 Paste JSON here:</label>
                         <textarea id="custom-json-input" placeholder='// PASTE JSON like: { "topic": "My Topic", "questions": [ { "id": 1, "question": "...", "choices": [...], "answerIndex": 0, "difficulty": "easy", ... }, ... ] }'></textarea>
                         <div id="custom-json-error" class="error" style="display: none;"></div> </div>
                      <div class="form-group">
                         <label for="new-custom-difficulty-select">📊 Filter by Difficulty:</label>
                         <select id="new-custom-difficulty-select">
                             <option value="all">All</option>
                             <option value="easy">Easy</option>
                             <option value="medium">Medium</option>
                             <option value="hard">Hard</option>
                         </select>
                     </div>
                     <div class="form-group">
                         <input type="checkbox" id="new-custom-randomize-checkbox" checked>
                         <label for="new-custom-randomize-checkbox" class="inline-label">🔀 Randomize Questions</label>
                     </div>
                     <button type="button" id="start-new-custom-quiz-btn" class="btn">Parse & Start New Custom Quiz</button>
  
                     <div class="ai-prompt-area">
                         <p>🤖 Need questions? Ask an AI (like ChatGPT, Gemini, Claude) using this prompt structure:</p>
                         <pre><code id="ai-prompt-text">${aiPrompt}</code></pre>
                         <button class="copy-btn" id="copy-ai-prompt-btn" title="Copy Prompt">Copy</button>
                     </div>
                 </div>
             </div>
           </div>
         `;
        // Add form submission handlers
        document.getElementById('quiz-setup-form').addEventListener('submit', handleTopicQuizStart);
        document.getElementById('start-new-custom-quiz-btn').addEventListener('click', handleNewCustomQuizStart); // Renamed button ID and handler
        if (savedQuizTopics.length > 0) {
            document.getElementById('start-saved-custom-btn').addEventListener('click', handleStartSavedCustomQuiz);
        }
        // Add AI prompt copy handler
        document.getElementById('copy-ai-prompt-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(aiPrompt)
                .then(() => {
                    const btn = document.getElementById('copy-ai-prompt-btn');
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = 'Copy'; }, 2000); // Reset after 2s
                })
                .catch(err => console.error('Failed to copy prompt: ', err));
        });
    }


    /** Render the main quiz interface */
    function renderQuizView() {
        // ... (no changes from previous version - already shows state.currentTopic) ...
        if (!state.filteredDeck || state.filteredDeck.length === 0) {
            viewContainer.innerHTML = `
              <div class="view quiz-view error text-center">
                  <p>No questions found for "${state.currentTopic}" with the selected difficulty filter ('${state.currentDifficulty}').</p>
                  <p><a href="#/home" class="btn">Back to Setup</a></p>
              </div>`;
            return;
        }
        viewContainer.innerHTML = `
          <div class="view quiz-view">
              <h2>${state.currentTopic}</h2> <div id="progress-bar-area"></div>
              <div id="question-card-area"></div>
              <div id="choices-area"></div>
              <div id="feedback-area" aria-live="polite"></div>
          </div>
      `;
        displayCurrentQuestion();
    }

    // --- Other UI rendering functions (renderQuestionCard, renderChoices, renderProgressBar, renderModal, renderResultsView, renderSolutionsView, renderAnalyticsView) ---
    // --- remain the same as the previous version. Ensure they handle state.currentTopic correctly. ---
    /** Renders a single question card */
    function renderQuestionCard(question, index, total) {
        // ... (no changes) ...
        let imageHtml = '';
        if (question.imagePath) {
            const isExternal = question.imagePath.startsWith('http://') || question.imagePath.startsWith('https://');
            const imageSrc = isExternal ? question.imagePath : `./assets/images/${question.imagePath}`;
            try {
                if (isExternal) new URL(imageSrc);
                imageHtml = `<img src="${imageSrc}" alt="Question image" style="margin: 10px auto; max-height: 200px; border-radius: var(--border-radius);">`;
            } catch (e) {
                console.warn(`Invalid imagePath URL: ${question.imagePath}`);
                imageHtml = '<p><small>(Image URL invalid)</small></p>';
            }
        }
        const questionHtml = question.question
            .replace(/\$\$(.*?)\$\$/g, '<span class="latex-mathdisplay">$1</span>')
            .replace(/\$(.*?)\$/g, '<span class="latex-mathinline">$1</span>');

        return `
          <div class="card question-card">
            <div class="card-header">Question ${index} of ${total} (${question.difficulty})</div>
            <div class="card-content">
              ${imageHtml}
              <p class="question-text" style="font-size: var(--font-size-md);">${questionHtml}</p>
              ${question.hint ? `<button id="hint-btn" class="btn btn-secondary btn-sm" style="margin-top: 10px;">💡 Show Hint</button>` : ''}
            </div>
          </div>
        `;
    }
    /** Renders the answer choices */
    function renderChoices(choices) {
        // ... (no changes) ...
        const choicesHtml = choices.map((choice, index) => {
            const choiceHtml = choice
                .replace(/\$\$(.*?)\$\$/g, '<span class="latex-mathdisplay">$1</span>')
                .replace(/\$(.*?)\$/g, '<span class="latex-mathinline">$1</span>');

            return `
                <li class="choice-item">
                    <button data-index="${index}">${choiceHtml}</button>
                </li>`;
        }).join('');
        return `<ul class="choice-list">${choicesHtml}</ul>`;
    }
    /** Renders the progress bar */
    function renderProgressBar(done, total) {
        // ... (no changes) ...
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        return `
          <div class="progress-bar-container" title="${done}/${total} questions answered" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar-inner" style="width: ${progress}%;">
              ${progress}%
              </div>
          </div>`;
    }
    /** Shows a modal window */
    function renderModal(contentHtml) {
        // ... (no changes) ...
        modalRoot.innerHTML = `
              <div class="modal-content" role="dialog" aria-modal="true">
              <button class="modal-close-btn" aria-label="Close modal">&times;</button>
              ${contentHtml}
              </div>
          `;
        modalRoot.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalRoot.addEventListener('click', (event) => { if (event.target === modalRoot) closeModal(); });
        modalRoot.classList.add('visible');
        modalRoot.querySelector('.modal-close-btn')?.focus();
    }
    /** Closes the modal window */
    function closeModal() {
        // ... (no changes) ...
        modalRoot.classList.remove('visible');
        modalRoot.innerHTML = '';
    }
    /** Renders the quiz results page */
    function renderResultsView(entryId) {
        // ... (no changes - already uses result.topic) ...
        const result = state.history.find(entry => entry.id === entryId);
        if (!result) {
            viewContainer.innerHTML = `<div class="view results-view error"><p>Results not found.</p><a href="#/home" class="btn">Home</a></div>`;
            return;
        }
        const avgTime = result.responseTimes.length > 0
            ? (result.responseTimes.reduce((a, b) => a + b, 0) / result.responseTimes.length / 1000).toFixed(2)
            : 'N/A';

        viewContainer.innerHTML = `
              <div class="view results-view text-center">
                  <h1>🎉 Quiz Complete! 🎉</h1>
                  <h2>Results for: ${result.topic}</h2>
                  <div class="card">
                      <div class="card-content">
                          <p><strong>Difficulty Filter:</strong> ${result.difficulty}</p>
                          <p><strong>Score:</strong> <strong style="font-size: 1.2em; color: ${result.score >= 80 ? 'var(--success)' : result.score >= 50 ? 'var(--accent-alt)' : 'var(--error)'};">${result.score}%</strong> (${result.numCorrect}/${result.numQuestions})</p>
                          <p><strong>Average Answer Time:</strong> ${avgTime} seconds</p>
                          <div style="margin-top: var(--spacing-lg); display: flex; justify-content: center; gap: var(--spacing-md);">
                              <a href="#/solutions/${result.id}" class="btn">✍️ Review Answers</a>
                              <a href="#/home" class="btn btn-secondary">🏠 Play Again</a>
                          </div>
                      </div>
                  </div>
              </div>
          `;
    }
    /** Renders the solutions review page */
    function renderSolutionsView(entryId) {
        // ... (no changes - already uses entry.topic) ...
        const entry = state.history.find(e => e.id === entryId);
        if (!entry) {
            viewContainer.innerHTML = `<div class="view error"><p>Could not find quiz entry.</p><a href="#/home" class="btn">Home</a></div>`;
            return;
        }

        let solutionsHtml = `<div class="view solutions-view"><h1>✍️ Review: ${entry.topic} (${entry.difficulty})</h1>`;

        entry.deck.forEach((question, index) => {
            const userAnswer = entry.answers.find(a => a.questionId === question.id);
            const selectedIndex = userAnswer ? userAnswer.selectedAnswerIndex : -1;
            const isCorrect = userAnswer ? userAnswer.isCorrect : false;
            const correctIndex = question.answerIndex;

            // Basic LaTeX Handling
            const questionHtml = question.question
                .replace(/\$\$(.*?)\$\$/g, '<span class="latex-mathdisplay">$1</span>')
                .replace(/\$(.*?)\$/g, '<span class="latex-mathinline">$1</span>');
            const explanationHtml = question.explanation
                ?.replace(/\$\$(.*?)\$\$/g, '<span class="latex-mathdisplay">$1</span>')
                .replace(/\$(.*?)\$/g, '<span class="latex-mathinline">$1</span>');

            solutionsHtml += `
                  <div class="card solution-card">
                      <div class="card-header">Question ${index + 1} (${question.difficulty})</div>
                      <div class="card-content">
                          <p><strong>${questionHtml}</strong></p>
                          <ul class="solution-choices">
                              ${question.choices.map((choice, i) => {
                const choiceHtml = choice
                    .replace(/\$\$(.*?)\$\$/g, '<span class="latex-mathdisplay">$1</span>')
                    .replace(/\$(.*?)\$/g, '<span class="latex-mathinline">$1</span>');
                let classes = '';
                let feedback = '';
                if (i === correctIndex) classes += ' correct';
                if (i === selectedIndex) {
                    classes += ' selected';
                    if (!isCorrect) classes += ' incorrect';
                }
                if (i === correctIndex) feedback = '<span class="feedback">(Correct Answer ✔️)</span>';
                if (i === selectedIndex && i !== correctIndex) feedback = '<span class="feedback">(Your Answer ❌)</span>';
                if (i === selectedIndex && i === correctIndex) feedback = '<span class="feedback">(Your Answer ✔️)</span>';

                return `<li class="${classes.trim()}">${choiceHtml} ${feedback}</li>`;
            }).join('')}
                          </ul>
                          ${explanationHtml ? `<p class="explanation"><strong>Explanation:</strong> ${explanationHtml}</p>` : ''}
                          ${userAnswer ? `<p style="font-size: var(--font-size-sm); opacity: 0.8; margin-top: var(--spacing-sm);"><em>Response time: ${(userAnswer.responseTime / 1000).toFixed(2)}s</em></p>` : ''}
                      </div>
                  </div>
              `;
        });

        solutionsHtml += `<a href="#/results?id=${entryId}" class="btn btn-secondary" style="margin-top: 15px;">📊 Back to Results</a></div>`;
        viewContainer.innerHTML = solutionsHtml;
    }
    /** Renders the analytics page */
    function renderAnalyticsView() {
        // ... (no changes - already uses entry.topic) ...
        const history = state.history;
        const totalQuizzes = history.length;
        const avgScore = totalQuizzes > 0
            ? (history.reduce((sum, entry) => sum + entry.score, 0) / totalQuizzes).toFixed(1) : 'N/A';
        const allResponseTimes = history.flatMap(entry => entry.responseTimes);
        const avgTimeOverall = allResponseTimes.length > 0
            ? (allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length / 1000).toFixed(2) : 'N/A';

        viewContainer.innerHTML = `
              <div class="view analytics-view">
                  <h1>📊 Analytics Dashboard</h1>
                  ${totalQuizzes === 0 ? '<p class="text-center" style="margin: var(--spacing-xl) 0;">Take some quizzes to see your stats!</p>' : `
                      <div class="card">
                          <div class="card-header">📈 Overall Stats</div>
                          <div class="card-content">
                              <p><strong>Total Quizzes Taken:</strong> ${totalQuizzes}</p>
                              <p><strong>Average Score:</strong> ${avgScore}%</p>
                              <p><strong>Overall Average Answer Time:</strong> ${avgTimeOverall}s</p>
                              <button id="export-csv-btn" class="btn btn-secondary" style="margin-top: 15px;">💾 Export History (CSV)</button>
                          </div>
                      </div>
  
                      <div class="card">
                          <div class="card-header">📜 Quiz History</div>
                          <div class="card-content">
                              <ul style="list-style: none; padding: 0;">
                                  ${history.slice().reverse().map(entry => `
                                      <li>
                                          <span>
                                              ${new Date(entry.date).toLocaleString()}:
                                              <strong>${entry.topic}</strong> (${entry.difficulty}) -
                                              Score: ${entry.score}%
                                          </span>
                                          <a href="#/solutions/${entry.id}">Review</a>
                                      </li>
                                  `).join('')}
                              </ul>
                          </div>
                      </div>
                  `}
              </div>
          `;

        const exportBtn = document.getElementById('export-csv-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportHistoryToCSV);
        } else if (totalQuizzes === 0) {
            console.log("[Analytics] No history to export yet.");
        }
    }

    // --- Quiz Logic ---

    /** Handles the submission of the standard topic setup form */
    async function handleTopicQuizStart(event) {
        // ... (no changes from previous version) ...
        event.preventDefault();
        const topicSelect = document.getElementById('topic-select');
        const difficultySelect = document.getElementById('difficulty-select');
        const randomizeCheckbox = document.getElementById('randomize-checkbox');
        state.currentTopic = topicSelect.value;
        state.currentDifficulty = difficultySelect.value;
        state.randomize = randomizeCheckbox.checked;
        state.customDeck = null;
        if (!state.currentTopic) { alert('Please select a topic.'); return; }
        console.log(`[Quiz Start] Topic: ${state.currentTopic}, Difficulty: ${state.currentDifficulty}, Randomize: ${state.randomize}`);
        viewContainer.innerHTML = '<p>Loading questions...</p>';
        try {
            state.fullDeck = await loadDeckFromFile(state.currentTopic);
            filterAndPrepareDeck();
            if (state.filteredDeck.length > 0) {
                location.hash = '#/quiz';
            } else {
                console.warn(`No questions found for topic '${state.currentTopic}' with difficulty filter '${state.currentDifficulty}'.`);
                renderQuizView();
            }
        } catch (error) {
            console.error("Error starting topic quiz:", error);
            viewContainer.innerHTML = `<p class="error text-center">Failed to load quiz questions for ${state.currentTopic}. Please try again later.<br>(${error.message})</p><p class="text-center"><a href="#/home" class="btn">Back</a></p>`;
        }
    }

    /** Handles the start request for a NEW custom JSON quiz */
    function handleNewCustomQuizStart() { // Renamed handler
        const jsonInput = document.getElementById('custom-json-input');
        const difficultySelect = document.getElementById('new-custom-difficulty-select'); // Use new select ID
        const randomizeCheckbox = document.getElementById('new-custom-randomize-checkbox'); // Use new checkbox ID
        const errorDiv = document.getElementById('custom-json-error');

        const jsonText = jsonInput.value.trim();
        // Read settings for this specific action
        state.currentDifficulty = difficultySelect.value;
        state.randomize = randomizeCheckbox.checked;
        // Clear state before processing
        state.customDeck = null;
        state.fullDeck = [];
        state.currentTopic = null;
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';

        if (!jsonText) {
            errorDiv.textContent = 'Please paste your JSON data into the text area.';
            errorDiv.style.display = 'block';
            return;
        }

        try {
            const parsedData = JSON.parse(jsonText);

            // Validate top-level structure {topic, questions}
            if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
                throw new Error('Invalid JSON format: Expected an object with "topic" and "questions" keys. Check for extra brackets [] around your object.');
            }
            if (!parsedData.topic || typeof parsedData.topic !== 'string' || parsedData.topic.trim() === '') {
                throw new Error('Invalid JSON format: Missing or empty "topic" string.');
            }
            if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
                throw new Error('Invalid JSON format: Missing or invalid "questions" array.');
            }

            validateDeckStructure(parsedData.questions, `Pasted Input: ${parsedData.topic}`); // Validate the nested questions array

            // ---- NEW: Save to localStorage ----
            state.savedCustomQuizzes[parsedData.topic] = parsedData; // Add/overwrite in memory
            saveCustomQuizzes(); // Persist to localStorage
            console.log(`[Storage] Saved/Updated custom quiz topic: "${parsedData.topic}"`);
            // ---- End NEW ----

            // Prepare state for quiz start
            state.customDeck = parsedData.questions;
            state.currentTopic = parsedData.topic;
            console.log(`[Quiz Start] Custom JSON processed. Topic: "${state.currentTopic}". Questions: ${state.customDeck.length}, Difficulty Filter: ${state.currentDifficulty}, Randomize: ${state.randomize}`);

            filterAndPrepareDeck(); // Filter based on state.customDeck

            if (state.filteredDeck.length > 0) {
                location.hash = '#/quiz'; // Navigate to quiz view
            } else {
                errorDiv.textContent = `No questions found in the pasted JSON for topic "${state.currentTopic}" match the selected difficulty ('${state.currentDifficulty}'). Quiz saved, but cannot start with this filter.`;
                errorDiv.style.display = 'block';
                state.customDeck = null; // Reset custom deck as it's not usable now
                state.currentTopic = null;
                // Re-render home view to show the updated saved list immediately (optional)
                // renderHomeView();
            }

        } catch (error) {
            console.error("Error processing pasted JSON:", error);
            // Check for common syntax errors and provide hints
            let userErrorMessage = `Error processing JSON: ${error.message}`;
            if (error instanceof SyntaxError) {
                userErrorMessage += "\n\n⚠️ Common JSON errors: Check for missing/extra commas (especially trailing commas after the last item), mismatched curly braces {} or square brackets [], or unquoted keys/strings.";
            }
            errorDiv.textContent = userErrorMessage;
            errorDiv.style.display = 'block';
            state.customDeck = null;
            state.currentTopic = null;
        }
    }

    /** --- NEW: Handles starting a saved custom quiz --- */
    function handleStartSavedCustomQuiz() {
        const topicSelect = document.getElementById('saved-custom-topic-select');
        const difficultySelect = document.getElementById('saved-custom-difficulty-select'); // Use saved selects
        const randomizeCheckbox = document.getElementById('saved-custom-randomize-checkbox'); // Use saved checkbox

        const selectedTopic = topicSelect.value;

        if (!selectedTopic) {
            alert("Please select a saved custom quiz topic.");
            return;
        }

        const savedQuizData = state.savedCustomQuizzes[selectedTopic];

        if (!savedQuizData || !savedQuizData.questions) {
            console.error(`Could not find saved data for topic: ${selectedTopic}`);
            alert(`Error: Could not load saved quiz data for "${selectedTopic}". It might be corrupted.`);
            return;
        }

        // Set state from saved quiz
        state.currentTopic = savedQuizData.topic; // Or just selectedTopic, should be the same
        state.customDeck = savedQuizData.questions;
        state.fullDeck = []; // Ensure file deck is clear

        // Set options from the 'saved quiz' section controls
        state.currentDifficulty = difficultySelect.value;
        state.randomize = randomizeCheckbox.checked;

        console.log(`[Quiz Start] Saved Custom Quiz: "${state.currentTopic}", Difficulty: ${state.currentDifficulty}, Randomize: ${state.randomize}`);

        filterAndPrepareDeck(); // Filter the loaded custom deck

        if (state.filteredDeck.length > 0) {
            location.hash = '#/quiz'; // Navigate
        } else {
            alert(`No questions found for saved quiz "${state.currentTopic}" match the selected difficulty ('${state.currentDifficulty}').`);
            state.customDeck = null; // Reset deck as it's not usable
            state.currentTopic = null;
        }
    }


    /** Displays the current question and choices - **Updated Hint Listener** */
    function displayCurrentQuestion() {
        if (state.currentIndex >= state.filteredDeck.length) {
            finishQuiz();
            return;
        }

        const question = state.filteredDeck[state.currentIndex];
        const cardArea = document.getElementById('question-card-area');
        const choicesArea = document.getElementById('choices-area');
        const progressArea = document.getElementById('progress-bar-area');
        const feedbackArea = document.getElementById('feedback-area');


        if (progressArea) progressArea.innerHTML = renderProgressBar(state.currentIndex, state.filteredDeck.length);
        if (cardArea) {
            cardArea.innerHTML = renderQuestionCard(question, state.currentIndex + 1, state.filteredDeck.length);
            // --- **FIX**: Add hint listener AFTER innerHTML is set ---
            const hintBtn = cardArea.querySelector('#hint-btn'); // Query within the cardArea
            if (hintBtn) {
                hintBtn.addEventListener('click', () => {
                    if (question.hint) {
                        renderModal(`<h3>💡 Hint</h3><p>${question.hint}</p>`);
                    } else {
                        renderModal(`<h3>💡 Hint</h3><p>No hint available for this question.</p>`); // Handle no hint case
                    }
                }, { once: true }); // Add listener only once per question display
            }
            // Add MathJax/KaTeX processing call here if using
            // if (window.MathJax) { window.MathJax.typesetPromise([cardArea]); }
        }
        if (choicesArea) {
            choicesArea.innerHTML = renderChoices(question.choices);
            choicesArea.querySelectorAll('.choice-item button').forEach(button => {
                button.addEventListener('click', handleAnswerSelection);
            });
            // Add MathJax/KaTeX processing call here if using
            // if (window.MathJax) { window.MathJax.typesetPromise([choicesArea]); }
        }
        if (feedbackArea) feedbackArea.innerHTML = ''; // Clear feedback

        state.startTime = Date.now(); // Record question start time
        console.log(`[Quiz] Displaying Q${state.currentIndex + 1}/${state.filteredDeck.length}`);
    }

    /** Handles the user selecting an answer */
    function handleAnswerSelection(event) {
        // ... (no changes from previous version) ...
        const selectedButton = event.target.closest('button');
        if (!selectedButton || selectedButton.disabled) return;
        const selectedIndex = parseInt(selectedButton.dataset.index, 10);
        const responseTime = Date.now() - state.startTime;
        const question = state.filteredDeck[state.currentIndex];
        const isCorrect = selectedIndex === question.answerIndex;
        console.log(`[Quiz] Answered Q${state.currentIndex + 1}: Index=${selectedIndex}, Correct=${isCorrect}, Time=${responseTime}ms`);
        state.answers.push({
            questionId: question.id,
            selectedAnswerIndex: selectedIndex,
            correctAnswerIndex: question.answerIndex,
            isCorrect: isCorrect,
            responseTime: responseTime,
        });
        const choiceButtons = viewContainer.querySelectorAll('.choice-item button');
        choiceButtons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === question.answerIndex) btn.classList.add('correct');
            if (index === selectedIndex && !isCorrect) btn.classList.add('incorrect', 'shake');
        });
        const feedbackArea = document.getElementById('feedback-area');
        if (feedbackArea) { feedbackArea.textContent = isCorrect ? 'Correct! ✅' : 'Incorrect. ❌'; }
        setTimeout(() => {
            state.currentIndex++;
            displayCurrentQuestion();
        }, 1800);
    }

    /** Calculates score and navigates to results */
    function finishQuiz() {
        // ... (no changes from previous version - already uses state.currentTopic) ...
        console.log('[Quiz] Finished. Calculating results...');
        const numCorrect = state.answers.filter(a => a.isCorrect).length;
        const numQuestions = state.filteredDeck.length;
        const score = numQuestions > 0 ? Math.round((numCorrect / numQuestions) * 100) : 0;
        const responseTimes = state.answers.map(a => a.responseTime);
        const date = new Date().toISOString();
        const entryId = `quiz-${Date.now()}`;
        const resultEntry = {
            id: entryId, date: date, topic: state.currentTopic, difficulty: state.currentDifficulty,
            score: score, numCorrect: numCorrect, numQuestions: numQuestions,
            responseTimes: responseTimes, answers: [...state.answers], deck: [...state.filteredDeck]
        };
        state.history.push(resultEntry);
        saveHistory();
        console.log('[Quiz] Results saved:', resultEntry);
        location.hash = `#/results?id=${entryId}`;
    }

    // --- Local Storage & History ---
    function loadHistory() {
        // ... (no changes) ...
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
            try {
                state.history = JSON.parse(storedHistory);
                if (!Array.isArray(state.history)) {
                    console.warn("Invalid history format in localStorage, resetting.");
                    state.history = [];
                }
                console.log(`[Storage] Loaded ${state.history.length} history entries.`);
            } catch (error) {
                console.error("[Storage] Failed to parse history from localStorage:", error);
                state.history = [];
            }
        }
    }
    function saveHistory() {
        // ... (no changes) ...
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.history));
            console.log(`[Storage] Saved ${state.history.length} history entries.`);
        } catch (error) {
            console.error("[Storage] Failed to save history to localStorage:", error);
        }
    }
    function exportHistoryToCSV() {
        // ... (no changes) ...
        if (state.history.length === 0) { alert("No history to export."); return; }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Date,Topic,Difficulty Filter,Score (%),Correct,Total,Avg Response Time (ms)\r\n";
        const formatCsvCell = (value) => {
            const stringValue = String(value == null ? "" : value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };
        state.history.forEach(entry => {
            const avgTime = entry.responseTimes.length > 0
                ? (entry.responseTimes.reduce((a, b) => a + b, 0) / entry.responseTimes.length).toFixed(0) : 'N/A';
            const row = [
                entry.id, new Date(entry.date).toLocaleString(), entry.topic, entry.difficulty,
                entry.score, entry.numCorrect, entry.numQuestions, avgTime
            ].map(formatCsvCell).join(",");
            csvContent += row + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `quiz_app_history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("[Export] History exported to CSV.");
    }

    // --- NEW: Custom Quiz Storage ---
    function loadCustomQuizzes() {
        const storedQuizzes = localStorage.getItem(CUSTOM_QUIZZES_STORAGE_KEY);
        if (storedQuizzes) {
            try {
                state.savedCustomQuizzes = JSON.parse(storedQuizzes);
                // Basic validation: ensure it's an object
                if (typeof state.savedCustomQuizzes !== 'object' || state.savedCustomQuizzes === null || Array.isArray(state.savedCustomQuizzes)) {
                    console.warn("Invalid custom quizzes format in localStorage, resetting.");
                    state.savedCustomQuizzes = {};
                }
                console.log(`[Storage] Loaded ${Object.keys(state.savedCustomQuizzes).length} saved custom quizzes.`);
            } catch (error) {
                console.error("[Storage] Failed to parse custom quizzes from localStorage:", error);
                state.savedCustomQuizzes = {}; // Reset if parsing fails
            }
        }
    }

    function saveCustomQuizzes() {
        try {
            localStorage.setItem(CUSTOM_QUIZZES_STORAGE_KEY, JSON.stringify(state.savedCustomQuizzes));
            console.log(`[Storage] Saved ${Object.keys(state.savedCustomQuizzes).length} custom quizzes.`);
        } catch (error) {
            console.error("[Storage] Failed to save custom quizzes to localStorage:", error);
            // Handle quota errors if necessary
            alert("Error saving custom quiz: Storage might be full.");
        }
    }
    // --- End NEW ---


    // --- Initialization ---
    function init() {
        console.log('[App] Initializing QuizApp...');
        loadHistory();
        loadCustomQuizzes(); // Load saved custom quizzes
        // Listen to hash changes for routing
        window.addEventListener('hashchange', handleRouteChange);
        // Handle initial route on page load
        handleRouteChange();
        // Add global listener for Escape key to close modal
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
        console.log('[App] QuizApp Ready.');
    }

    // Start the application
    init();

})(); // End IIFE
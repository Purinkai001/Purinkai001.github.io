document.getElementById('proceed-btn').addEventListener('click', function() {
    const passwordInput = document.getElementById('password-input').value;
    const errorMessage = document.getElementById('error-message');

    // Correct password is '1234'
    if (passwordInput === '1234') {
        window.location.href = 'main.html';  // Redirect to the main page
    } else {
        errorMessage.style.display = 'block';  // Show error message
    }
});

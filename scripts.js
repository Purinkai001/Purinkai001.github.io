// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');

    // Adjust neon button colors
    const neonButtons = document.querySelectorAll('.neon-button');
    neonButtons.forEach(button => {
        if (document.body.classList.contains('light-theme')) {
            button.style.backgroundColor = '#fff';
            button.style.color = '#9400D3';
        } else {
            button.style.backgroundColor = '#9400D3';
            button.style.color = '#fff';
        }
    });

    // Adjust project hover effects for both themes
    const projects = document.querySelectorAll('.project');
    projects.forEach(project => {
        if (document.body.classList.contains('light-theme')) {
            project.style.boxShadow = '0 0 15px #9400D3';
        } else {
            project.style.boxShadow = 'none';
        }
    });

    // Adjust skills section background for light theme
    const skills = document.querySelectorAll('.skill');
    skills.forEach(skill => {
        if (document.body.classList.contains('light-theme')) {
            skill.style.backgroundColor = '#f0f0f0';
            skill.style.color = '#000';
        } else {
            skill.style.backgroundColor = '#111';
            skill.style.color = '#fff';
        }
    });

    // Adjust contact section for light theme
    const contactSection = document.getElementById('contact');
    const contactInputs = document.querySelectorAll('#contact-form input, #contact-form textarea');
    const contactButton = document.querySelector('#contact-form button');

    if (document.body.classList.contains('light-theme')) {
        contactSection.style.backgroundColor = '#f9f9f9';
        contactSection.style.color = '#000';
        contactInputs.forEach(input => {
            input.style.backgroundColor = '#fff';
            input.style.borderColor = '#9400D3';
            input.style.color = '#000';
        });
        contactButton.style.backgroundColor = '#fff';
        contactButton.style.color = '#9400D3';
    } else {
        contactSection.style.backgroundColor = '#000';
        contactSection.style.color = '#fff';
        contactInputs.forEach(input => {
            input.style.backgroundColor = '#111';
            input.style.borderColor = '#9400D3';
            input.style.color = '#fff';
        });
        contactButton.style.backgroundColor = '#9400D3';
        contactButton.style.color = '#fff';
    }
});

// Smooth scrolling
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Modal functionality
const modal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
document.querySelectorAll('.project').forEach(project => {
    project.addEventListener('click', function() {
        const projectName = this.getAttribute('data-project');
        modalTitle.textContent = projectName;
        modalDescription.textContent = projectName + ' details go here.';
        modal.classList.add('active');
    });
});

document.querySelector('.modal-close').addEventListener('click', () => {
    modal.classList.remove('active');
    modal.classList.add('inactive');

    // Wait for animation to finish before hiding
    setTimeout(() => {
        modal.classList.remove('inactive');
    }, 400);
});

// Dropdown menu click handling
document.querySelector('.dropbtn').addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default anchor behavior
    const dropdownContent = this.nextElementSibling;
    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
});

// Close the dropdown if clicked outside
window.addEventListener('click', function (e) {
    if (!e.target.matches('.dropbtn')) {
        const dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

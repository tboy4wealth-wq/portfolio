// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');
const body = document.body;
const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000/api"
        : "https://portfolio-wu0n.onrender.com/api";

themeToggle.addEventListener('click', () => {
  if (body.classList.contains('dark-theme')) {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
  } else {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-moon');
  }
});

// Project Media Toggle
const viewImagesBtn = document.getElementById('viewImagesBtn');
const viewVideosBtn = document.getElementById('viewVideosBtn');
const projectImages = document.querySelectorAll('.project-img');
const projectVideos = document.querySelectorAll('.project-video');

viewImagesBtn.addEventListener('click', () => {
  viewImagesBtn.classList.add('active');
  viewVideosBtn.classList.remove('active');

  projectImages.forEach(img => img.style.display = 'block');
  projectVideos.forEach(video => {
    video.style.display = 'none';
    video.pause();
  });
});

viewVideosBtn.addEventListener('click', () => {
  viewVideosBtn.classList.add('active');
  viewImagesBtn.classList.remove('active');

  projectImages.forEach(img => img.style.display = 'none');
  projectVideos.forEach(video => video.style.display = 'block');
});

// Back to Top Button
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 500) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('nav a, .footer-links a, .cta-buttons a').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  });
});

// Add active class to navigation links on scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;

    if (pageYOffset >= (sectionTop - 150)) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// ================================
// Contact Form Submission
// ================================

const contactForm = document.getElementById("messageForm");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = contactForm.querySelector(".submit-btn");

  const originalBtn = submitBtn.innerHTML;

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !subject || !message) {

    Swal.fire({
      icon: "warning",
      title: "Missing Information",
      text: "Please fill in all fields."
    });

    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {

    Swal.fire({
      icon: "error",
      title: "Invalid Email",
      text: "Please enter a valid email address."
    });

    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML =
    `<i class="fas fa-spinner fa-spin"></i> Sending...`;

  Swal.fire({
    title: "Sending Message...",
    text: "Please wait while your message is being delivered.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {

    const response = await fetch(`${API_URL}/contact`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name,
        email,
        subject,
        message
      })

    });

    const result = await response.json();

    Swal.close();

    if (response.ok && result.success) {

      Swal.fire({
        icon: "success",
        title: "Message Sent!",
        text: "Thank you for reaching out. I'll get back to you as soon as possible.",
        confirmButtonText: "Awesome!"
      });

      contactForm.reset();

    } else {

      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: result.message
      });

    }

  } catch (error) {

    Swal.close();

    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Unable to connect to the server."
    });

    console.error(error);

  } finally {

    submitBtn.disabled = false;

    submitBtn.innerHTML = originalBtn;

  }

});
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");
  const rememberCheck = document.getElementById("remember");

  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api"
      : "https://portfolio-wu0n.onrender.com/api";

  // ================================
  // Redirect if already logged in
  // ================================
  const token = localStorage.getItem("token");

  if (token && token.trim() !== "") {
    window.location.replace("/dashboard.html");
  }

  // ================================
  // Remember Email
  // ================================
  const savedEmail = localStorage.getItem("adminEmail");

  if (savedEmail) {
    document.getElementById("email").value = savedEmail;
    rememberCheck.checked = true;
  }

  // ================================
  // Login
  // ================================
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter both email and password.",
        confirmButtonColor: "#D32F2F",
      });
      return;
    }

    loginBtn.disabled = true;

    // Loading Spinner
    Swal.fire({
      title: "Signing In...",
      text: "Please wait while we verify your credentials.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      // Save JWT
      localStorage.setItem("token", result.token);

      // Save admin info
      localStorage.setItem(
        "admin",
        JSON.stringify(result.admin)
      );

      // Remember email
      if (rememberCheck.checked) {
        localStorage.setItem("adminEmail", email);
      } else {
        localStorage.removeItem("adminEmail");
      }

      // Success Alert
      await Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome back, ${result.admin.name}!`,
        timer: 1800,
        showConfirmButton: false,
      });

      window.location.replace("/dashboard.html");

    } catch (error) {

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.message || "Unable to login.",
        confirmButtonColor: "#D32F2F",
      });

      loginBtn.disabled = false;
    }
  });
});
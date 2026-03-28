(function () {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const status = document.getElementById("loginStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get("email")).trim().toLowerCase();
    const password = String(formData.get("password"));
    const role = String(formData.get("role"));

    status.textContent = "Signing in...";
    try {
      const user = await window.AngelicAPI.login(email, password, role);
      localStorage.setItem("angelic_session", JSON.stringify({ role: user.role, userId: user.id, defendantId: user.defendant_id || null }));
      status.textContent = "Access granted.";
      window.location.href = user.role === "admin" ? "admin.html" : "defendant.html";
    } catch (err) {
      status.textContent = err.message;
    }
  });
})();

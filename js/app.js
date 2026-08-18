document.addEventListener("DOMContentLoaded", async () => {
    await Auth.init();
    Teams.init();
    PlayersUI.setupEvents();
    UsersUI.setupEvents();
    setupTabs();
    setupLogin();
    setupSorteo();
    setupExport();

    if (Auth.checkSession()) {
        await showApp();
    }
});

function setupTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
        });
    });
}

function setupLogin() {
    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value.trim().toUpperCase();
        const password = document.getElementById("password").value.trim();

        if (await Auth.login(username, password)) {
            await showApp();
        } else {
            document.getElementById("login-error").classList.remove("hidden");
            setTimeout(() => {
                document.getElementById("login-error").classList.add("hidden");
            }, 3000);
        }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        Auth.logout();
        document.getElementById("app-screen").classList.remove("active");
        document.getElementById("login-screen").classList.add("active");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.querySelectorAll(".tab-admin").forEach(el => el.classList.add("hidden"));
    });
}

async function showApp() {
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("app-screen").classList.add("active");
    document.getElementById("user-display").textContent =
        `${Auth.currentUser.username} (${Auth.isAdmin() ? 'Admin' : 'Usuario'})`;

    if (Auth.isAdmin()) {
        document.querySelectorAll(".tab-admin").forEach(el => el.classList.remove("hidden"));
    }

    await PlayersUI.init();
}

function setupSorteo() {
    document.querySelectorAll(".team-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".team-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            Teams.numTeams = parseInt(btn.dataset.teams);
            Teams.updateColors();
        });
    });

    document.getElementById("sort-btn").addEventListener("click", () => {
        Teams.animateAndSort();
    });
}

function setupExport() {
    document.getElementById("export-pdf-btn").addEventListener("click", () => {
        ExportPDF.generate();
    });
}

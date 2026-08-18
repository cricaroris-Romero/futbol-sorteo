const Auth = {
    currentUser: null,
    users: [],
    unsubscribe: null,

    async init() {
        await this.seedDefaultUsers();
        this.listen();
    },

    async seedDefaultUsers() {
        const snapshot = await db.collection("users").get();
        if (snapshot.empty) {
            const batch = db.batch();
            Object.entries(USERS).forEach(([username, userData]) => {
                const ref = db.collection("users").doc(username.toLowerCase());
                batch.set(ref, {
                    username: username,
                    password: userData.password,
                    role: userData.role,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }
    },

    listen() {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = db.collection("users").onSnapshot(snapshot => {
            this.users = [];
            snapshot.forEach(doc => {
                this.users.push(doc.data());
            });
            if (typeof UsersUI !== "undefined") {
                UsersUI.render();
            }
        });
    },

    async login(username, password) {
        // Check local USERS first (always works)
        const localUser = USERS[username];
        if (localUser && localUser.password === password) {
            this.currentUser = { username, role: localUser.role };
            localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
            return true;
        }

        // Check Firestore for custom users
        try {
            const snapshot = await db.collection("users")
                .where("username", "==", username)
                .where("password", "==", password)
                .get();

            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                this.currentUser = { username: userData.username, role: userData.role };
                localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
                return true;
            }
        } catch (e) {
            console.error("Login error:", e);
        }

        return false;
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem("currentUser");
    },

    isAdmin() {
        return this.currentUser && this.currentUser.role === "admin";
    },

    checkSession() {
        const saved = localStorage.getItem("currentUser");
        if (saved) {
            this.currentUser = JSON.parse(saved);
            return true;
        }
        return false;
    },

    async createUser(username, password, role = "user") {
        const snapshot = await db.collection("users")
            .where("username", "==", username)
            .get();
        if (!snapshot.empty) return false;

        await db.collection("users").doc(username.toLowerCase()).set({
            username: username,
            password: password,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    },

    async deleteUser(username) {
        if (username === "CCRR" || username === "ZATA") return false;
        await db.collection("users").doc(username.toLowerCase()).delete();
        return true;
    },

    getUsers() {
        return this.users;
    }
};

const UsersUI = {
    async init() {
        await Auth.init();
        this.render();
    },

    setupEvents() {
        document.getElementById("create-user-btn").addEventListener("click", async () => {
            const username = document.getElementById("new-username").value.trim().toUpperCase();
            const password = document.getElementById("new-password").value.trim();

            if (!username || !password) {
                alert("Ingresa usuario y contraseña");
                return;
            }

            const success = await Auth.createUser(username, password);
            if (success) {
                document.getElementById("new-username").value = "";
                document.getElementById("new-password").value = "";
                alert("Usuario creado exitosamente");
            } else {
                alert("Ya existe un usuario con ese nombre");
            }
        });
    },

    render() {
        const container = document.getElementById("users-list");
        const users = Auth.getUsers();

        container.innerHTML = users.map(u => `
            <div class="player-card">
                <div class="player-info">
                    <div class="player-name">${u.username}</div>
                    <div class="player-details">
                        <span class="player-rating">${u.role === 'admin' ? 'Admin' : 'Usuario'}</span>
                    </div>
                </div>
                ${u.username !== 'CCRR' && u.username !== 'ZATA' ?
                    `<button class="btn-delete" onclick="UsersUI.remove('${u.username}')">✕</button>` : ''}
            </div>
        `).join('');
    },

    async remove(username) {
        if (confirm(`¿Eliminar usuario ${username}?`)) {
            await Auth.deleteUser(username);
        }
    }
};

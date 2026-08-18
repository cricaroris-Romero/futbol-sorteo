const Players = {
    addedPlayers: [],
    unsubscribe: null,

    async init() {
        await this.seedPreloadedPlayers();
        this.listen();
    },

    async seedPreloadedPlayers() {
        const snapshot = await db.collection("players").get();
        if (snapshot.empty) {
            const batch = db.batch();
            PRELOADED_PLAYERS.forEach(p => {
                const ref = db.collection("players").doc();
                batch.set(ref, {
                    name: p.name,
                    rating: p.rating,
                    position: p.position,
                    added: false,
                    isCustom: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }
    },

    listen() {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = db.collection("players").onSnapshot(snapshot => {
            this.addedPlayers = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.added) {
                    this.addedPlayers.push({
                        id: doc.id,
                        name: data.name,
                        rating: data.rating,
                        position: data.position
                    });
                }
            });
            if (typeof PlayersUI !== "undefined") {
                PlayersUI.render();
            }
        });
    },

    async createNewPlayer(name) {
        const snapshot = await db.collection("players")
            .where("name", "==", name)
            .get();
        if (!snapshot.empty) return false;

        await db.collection("players").add({
            name: name,
            rating: 3,
            position: "player",
            added: false,
            isCustom: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    },

    async add(name, rating, position) {
        const snapshot = await db.collection("players")
            .where("name", "==", name)
            .where("added", "==", true)
            .get();
        if (!snapshot.empty) return false;

        const docSnapshot = await db.collection("players")
            .where("name", "==", name)
            .get();
        if (!docSnapshot.empty) {
            await docSnapshot.docs[0].ref.update({
                rating: rating,
                position: position,
                added: true
            });
            return true;
        }
        return false;
    },

    async remove(name) {
        const snapshot = await db.collection("players")
            .where("name", "==", name)
            .get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            if (doc.data().isCustom) {
                await doc.ref.delete();
            } else {
                await doc.ref.update({ added: false });
            }
        }
    },

    async togglePosition(name, newPosition) {
        const snapshot = await db.collection("players")
            .where("name", "==", name)
            .get();
        if (!snapshot.empty) {
            await snapshot.docs[0].ref.update({ position: newPosition });
        }
    },

    getAll() {
        return this.addedPlayers;
    },

    async getAvailable() {
        const snapshot = await db.collection("players")
            .where("added", "==", false)
            .get();
        const available = [];
        snapshot.forEach(doc => {
            available.push({ name: doc.data().name });
        });
        return available;
    },

    renderList(container, isAdmin) {
        const players = this.getAll();
        if (players.length === 0) {
            container.innerHTML = '<p class="empty-msg">No hay jugadores seleccionados aún</p>';
            return;
        }
        container.innerHTML = players.map(p => `
            <div class="player-card">
                <div class="player-info">
                    <div class="player-name">${p.name}</div>
                    <div class="player-details">
                        <span class="player-rating">${p.rating} ★</span>
                        <select class="position-toggle" onchange="PlayersUI.togglePosition('${p.name}', this.value)" style="background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px; font-size: 0.75rem;">
                            <option value="player" ${p.position === 'player' ? 'selected' : ''}>⚽ Jugador</option>
                            <option value="goalkeeper" ${p.position === 'goalkeeper' ? 'selected' : ''}>🧤 Arquero</option>
                        </select>
                    </div>
                </div>
                <button class="btn-delete" onclick="PlayersUI.remove('${p.name}')">✕</button>
            </div>
        `).join('');
    },

    populateDropdown(selectEl) {
        this.getAvailable().then(available => {
            selectEl.innerHTML = '<option value="">Seleccionar jugador...</option>' +
                available.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
        });
    }
};

const PlayersUI = {
    selectedRating: 4,

    async init() {
        await Players.init();
        this.render();
    },

    render() {
        const listEl = document.getElementById("players-list");
        const dropdownEl = document.getElementById("player-select");
        const addSection = document.getElementById("add-player-section");
        const newPlayerSection = document.getElementById("new-player-section");
        const noMsg = document.getElementById("no-players-msg");

        // Todos pueden agregar de la lista
        addSection.classList.remove("hidden");

        // Solo admin puede crear jugadores nuevos
        if (Auth.isAdmin()) {
            newPlayerSection.classList.remove("hidden");
        } else {
            newPlayerSection.classList.add("hidden");
        }

        Players.renderList(listEl, Auth.isAdmin());
        Players.populateDropdown(dropdownEl);

        noMsg.style.display = Players.getAll().length === 0 ? "block" : "none";
    },

    setupEvents() {
        document.querySelectorAll("#tab-players .rating-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("#tab-players .rating-btn").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                this.selectedRating = parseInt(btn.dataset.rating);
            });
        });

        document.getElementById("add-player-btn").addEventListener("click", async () => {
            const name = document.getElementById("player-select").value;
            const position = document.getElementById("position-select").value;
            if (!name) {
                alert("Selecciona un jugador");
                return;
            }
            await Players.add(name, this.selectedRating, position);
            this.render();
        });

        document.getElementById("create-player-btn").addEventListener("click", async () => {
            const name = document.getElementById("new-player-name").value.trim();
            if (!name) {
                alert("Ingresa el nombre del jugador");
                return;
            }
            const success = await Players.createNewPlayer(name);
            if (success) {
                document.getElementById("new-player-name").value = "";
                alert("Jugador creado exitosamente");
                Players.populateDropdown(document.getElementById("player-select"));
            } else {
                alert("Ya existe un jugador con ese nombre");
            }
        });
    },

    async remove(name) {
        if (confirm(`¿Eliminar a ${name}?`)) {
            await Players.remove(name);
            this.render();
        }
    },

    async togglePosition(name, newPosition) {
        await Players.togglePosition(name, newPosition);
    }
};

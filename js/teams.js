const Teams = {
    numTeams: 4,
    teamColors: [...DEFAULT_COLORS],
    lastResult: null,

    init() {
        this.updateColors();
    },

    updateColors() {
        const container = document.getElementById("team-colors");
        container.innerHTML = '';
        for (let i = 0; i < this.numTeams; i++) {
            const div = document.createElement("div");
            div.className = "color-picker-group";
            div.innerHTML = `
                <label>Equipo ${i + 1}</label>
                <div class="color-options" data-index="${i}">
                    ${AVAILABLE_COLORS.map(c => `
                        <button type="button" class="color-option ${this.teamColors[i] === c.value ? 'selected' : ''}"
                            data-color="${c.value}" data-index="${i}"
                            style="background: ${c.value}; border: 2px solid ${c.value === '#ffffff' ? '#666' : c.value};"
                            title="${c.name}"></button>
                    `).join('')}
                </div>
            `;
            container.appendChild(div);
        }
        container.querySelectorAll(".color-option").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = e.target.dataset.index;
                const color = e.target.dataset.color;
                this.teamColors[idx] = color;
                document.querySelectorAll(`.color-option[data-index="${idx}"]`).forEach(b => b.classList.remove("selected"));
                e.target.classList.add("selected");
            });
        });
    },

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    sort(players, numTeams) {
        const totalPlayers = players.length;
        const perTeam = Math.floor(totalPlayers / numTeams);
        const remainder = totalPlayers % numTeams;

        const goalkeepers = this.shuffle([...players.filter(p => p.position === "goalkeeper")]);
        const fieldPlayers = players.filter(p => p.position !== "goalkeeper");

        const teams = [];
        for (let i = 0; i < numTeams; i++) {
            teams.push({
                name: `Equipo ${i + 1}`,
                color: this.teamColors[i] || DEFAULT_COLORS[i],
                players: [],
                totalRating: 0,
                maxPlayers: perTeam + (i < remainder ? 1 : 0)
            });
        }

        goalkeepers.forEach((gk, idx) => {
            if (idx < numTeams && teams[idx].players.length < teams[idx].maxPlayers) {
                teams[idx].players.push(gk);
                teams[idx].totalRating += gk.rating;
            }
        });

        // Group by rating, shuffle within each group
        const ratingGroups = {};
        fieldPlayers.forEach(p => {
            if (!ratingGroups[p.rating]) ratingGroups[p.rating] = [];
            ratingGroups[p.rating].push(p);
        });
        Object.values(ratingGroups).forEach(group => this.shuffle(group));

        // Interleave: take one from each rating group at a time
        // So the order is like: 5,4,3,2,1, 5,4,3,2,1, 4,3,2,1,...
        // This guarantees same-rating players go to different teams
        const ratingKeys = Object.keys(ratingGroups).map(Number).sort((a, b) => b - a);
        const ordered = [];
        let hasMore = true;

        while (hasMore) {
            hasMore = false;
            for (const r of ratingKeys) {
                if (ratingGroups[r].length > 0) {
                    ordered.push(ratingGroups[r].shift());
                    if (ratingGroups[r].length > 0) hasMore = true;
                }
            }
        }

        // Place each player: pick team with most room, break ties by lowest rating
        ordered.forEach(player => {
            let bestTeam = 0;
            let bestScore = -1;

            for (let i = 0; i < numTeams; i++) {
                const room = teams[i].maxPlayers - teams[i].players.length;
                if (room <= 0) continue;
                // Score: prioritize room, break ties with lowest total rating
                const score = room * 1000 - teams[i].totalRating;
                if (score > bestScore) {
                    bestScore = score;
                    bestTeam = i;
                }
            }

            teams[bestTeam].players.push(player);
            teams[bestTeam].totalRating += player.rating;
        });

        this.lastResult = teams;
        return teams;
    },

    renderResult(teams) {
        const container = document.getElementById("result-area");
        container.innerHTML = teams.map(team => {
            const avg = (team.totalRating / team.players.length).toFixed(1);
            const textColor = this.isLightColor(team.color) ? "#000" : "#fff";
            return `
                <div class="team-card" style="background: ${team.color}; border-color: ${team.color}; color: ${textColor};">
                    <h3>⚽ ${team.name}</h3>
                    ${team.players.map(p => `
                        <div class="team-player">
                            <span class="team-player-name">${p.name}</span>
                            <span class="team-player-badge ${p.position === 'goalkeeper' ? 'gk' : ''}" style="color: ${textColor}; border: 1px solid ${textColor}30;">
                                ${p.position === 'goalkeeper' ? '🧤' : `${p.rating}★`}
                            </span>
                        </div>
                    `).join('')}
                    <div class="team-avg">Promedio: ${avg} | ${team.players.length} jugadores</div>
                </div>
            `;
        }).join('');
    },

    isLightColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128;
    },

    async animateAndSort() {
        const players = Players.getAll();
        if (players.length < 2) {
            alert("Necesitas al menos 2 jugadores para hacer un sorteo");
            return;
        }
        if (players.length < this.numTeams) {
            alert(`Necesitas al menos ${this.numTeams} jugadores para ${this.numTeams} equipos`);
            return;
        }

        const overlay = document.getElementById("animation-overlay");
        const bouncingContainer = document.getElementById("bouncing-names");
        overlay.classList.remove("hidden");
        bouncingContainer.innerHTML = '<div class="sort-overlay-title">⚽ Sorteando equipos...</div>';

        // Create bouncing names
        const isMobile = window.innerWidth <= 600;
        const names = players.map(p => {
            const el = document.createElement("div");
            el.className = "bounce-name";
            el.textContent = p.name;
            el.style.left = Math.random() * 70 + 5 + "%";
            el.style.top = Math.random() * 60 + 15 + "%";
            el.style.animationDelay = Math.random() * 0.5 + "s";
            el.style.fontSize = (isMobile ? 0.7 + Math.random() * 0.4 : 0.8 + Math.random() * 0.8) + "rem";
            bouncingContainer.appendChild(el);
            return el;
        });

        // Animate for 5 seconds, moving names around
        const interval = setInterval(() => {
            names.forEach(el => {
                el.style.left = Math.random() * 70 + 5 + "%";
                el.style.top = Math.random() * 60 + 15 + "%";
                el.style.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
            });
        }, 300);

        await new Promise(r => setTimeout(r, 5000));
        clearInterval(interval);

        // Sort teams
        const teams = this.sort(players, this.numTeams);

        // Show each team one by one
        bouncingContainer.innerHTML = '';
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            bouncingContainer.innerHTML = `
                <div class="sort-overlay-title" style="color: ${team.color};">
                    ⚽ ${team.name}
                </div>
                <div class="team-reveal-players">
                    ${team.players.map(p => `
                        <div class="team-reveal-card" style="
                            background: ${team.color};
                            color: ${this.isLightColor(team.color) ? '#000' : '#fff'};
                        ">
                            ${p.position === 'goalkeeper' ? '🧤 ' : ''}${p.name}
                        </div>
                    `).join('')}
                </div>
            `;
            await new Promise(r => setTimeout(r, 2000));
        }

        await new Promise(r => setTimeout(r, 1000));
        overlay.classList.add("hidden");

        this.renderResult(teams);
        document.getElementById("export-pdf-btn").disabled = false;

        // Switch to result tab
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        document.querySelector('[data-tab="result"]').classList.add("active");
        document.getElementById("tab-result").classList.add("active");
    }
};

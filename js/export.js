const ExportPDF = {
    generate() {
        if (!Teams.lastResult) {
            alert("Primero realiza un sorteo");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("l", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Fondo negro
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // Titulo
        doc.setTextColor(0, 255, 136);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("SORTEO DE FUTBOL", pageWidth / 2, 18, { align: "center" });

        // Fecha
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const today = new Date().toLocaleDateString("es-CO", {
            day: "numeric", month: "long", year: "numeric"
        });
        doc.text(today, pageWidth / 2, 27, { align: "center" });

        // Equipos
        const teams = Teams.lastResult;
        const numTeams = teams.length;
        const marginX = 10;
        const gap = 8;
        const colWidth = (pageWidth - marginX * 2 - gap * (numTeams - 1)) / numTeams;
        const startY = 38;
        const headerHeight = 14;
        const rowHeight = 8;

        // Encontrar el maximo de jugadores
        const maxPlayers = Math.max(...teams.map(t => t.players.length));
        const tableHeight = headerHeight + (maxPlayers + 1) * rowHeight + 10;

        teams.forEach((team, i) => {
            const x = marginX + i * (colWidth + gap);
            const r = parseInt(team.color.slice(1, 3), 16);
            const g = parseInt(team.color.slice(3, 5), 16);
            const b = parseInt(team.color.slice(5, 7), 16);

            // Fondo del equipo
            doc.setFillColor(r, g, b);
            doc.roundedRect(x, startY, colWidth, tableHeight, 3, 3, "F");

            // Nombre del equipo
            doc.setTextColor(r, g, b);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(x, startY, colWidth, headerHeight, 3, 3, "F");
            doc.rect(x, startY + 7, colWidth, headerHeight - 7, "F");

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(team.name.toUpperCase(), x + colWidth / 2, startY + 10, { align: "center" });

            // Cabecera JUGADOR
            const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;
            const textColor = isLight ? [0, 0, 0] : [255, 255, 255];

            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("JUGADOR", x + colWidth / 2, startY + headerHeight + 7, { align: "center" });

            // Linea separadora
            doc.setDrawColor(textColor[0], textColor[1], textColor[2]);
            doc.setLineWidth(0.3);
            doc.line(x + 3, startY + headerHeight + 9, x + colWidth - 3, startY + headerHeight + 9);

            // Lista de jugadores
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);

            team.players.forEach((player, pIdx) => {
                const py = startY + headerHeight + 16 + pIdx * rowHeight;
                const posLabel = player.position === "goalkeeper" ? " (ARQ)" : "";
                doc.text(`${player.name}${posLabel}`, x + colWidth / 2, py, { align: "center" });
            });
        });

        // Pie de pagina
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.text("Generado por Sorteo de Equipos", pageWidth / 2, pageHeight - 5, { align: "center" });

        doc.save("sorteo_equipos.pdf");
    }
};

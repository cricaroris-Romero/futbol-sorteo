const ExportPDF = {
    generate() {
        if (!Teams.lastResult) {
            alert("Primero realiza un sorteo");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        doc.setFillColor(0, 255, 136);
        doc.rect(0, 0, pageWidth, 35, "F");

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("SORTEO DE EQUIPOS", pageWidth / 2, 15, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const today = new Date().toLocaleDateString("es-CO", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });
        doc.text(today, pageWidth / 2, 24, { align: "center" });

        let y = 45;
        const teams = Teams.lastResult;
        const cardWidth = (pageWidth - 30) / Math.min(teams.length, 2);
        const cardHeight = 100;
        const cardMargin = 10;

        teams.forEach((team, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);

            let x = 15 + col * (cardWidth + cardMargin);
            let yPos = y + row * (cardHeight + cardMargin);

            if (yPos + cardHeight > pageHeight - 20) {
                doc.addPage();
                doc.setFillColor(10, 10, 10);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
                y = 15;
                yPos = y + 0 * (cardHeight + cardMargin);
            }

            // Team card background
            const r = parseInt(team.color.slice(1, 3), 16);
            const g = parseInt(team.color.slice(3, 5), 16);
            const b = parseInt(team.color.slice(5, 7), 16);

            doc.setFillColor(r, g, b);
            doc.roundedRect(x, yPos, cardWidth, cardHeight, 5, 5, "F");

            // Team name
            doc.setTextColor(r, g, b);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(x, yPos, cardWidth, 14, 5, 5, "F");
            doc.rect(x, yPos + 7, cardWidth, 7, "F");

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(team.name.toUpperCase(), x + cardWidth / 2, yPos + 10, { align: "center" });

            // Players list
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;
            doc.setTextColor(isLight ? 0 : 255, isLight ? 0 : 255, isLight ? 0 : 255);

            team.players.forEach((player, pIdx) => {
                const py = yPos + 20 + pIdx * 7;
                const posLabel = player.position === "goalkeeper" ? " (ARQ)" : "";
                doc.text(`${player.name} - ${player.rating}★${posLabel}`, x + 5, py);
            });

            // Average
            const avg = (team.totalRating / team.players.length).toFixed(1);
            doc.setFontSize(7);
            doc.text(`Promedio: ${avg} | ${team.players.length} jugadores`, x + 5, yPos + cardHeight - 5);
        });

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text("Generado por Sorteo de Equipos ⚽", pageWidth / 2, pageHeight - 5, { align: "center" });

        doc.save("sorteo_equipos.pdf");
    }
};

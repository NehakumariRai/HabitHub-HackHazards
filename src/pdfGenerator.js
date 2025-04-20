function downloadPDF(id) {
  // Check if jsPDF is available
  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error("jsPDF not found. Make sure it's loaded in your extension.");
    alert("Failed to generate PDF. jsPDF library not loaded.");
    return;
  }

  const { jsPDF } = window.jspdf;

  chrome.storage.local.get(["habits"], (result) => {
    const habits = result.habits || [];
    const habit = habits.find((h) => h.id === id);
    if (!habit) {
      alert("Habit not found.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const cardX = 20;
    const cardY = 30;
    const cardWidth = pageWidth - 40;
    const cardHeight = pageHeight - 80;

    // Gradient background
    for (let i = 0; i < 30; i++) {
      const colorValue = 255 - i * 3;
      doc.setFillColor(255, colorValue, 255);
      doc.roundedRect(
        cardX + i * 0.3,
        cardY + i * 0.3,
        cardWidth - i * 0.6,
        cardHeight - i * 0.6,
        10,
        10,
        "F"
      );
    }

    // Inner card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX + 5, cardY + 5, cardWidth - 10, cardHeight - 10, 8, 8, "F");

    let y = cardY + 25;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(234, 76, 137);
    doc.text(habit.name.toUpperCase(), pageWidth / 2, y, { align: "center" });

    y += 15;

    // Streak badge
    doc.setFillColor(255, 215, 0);
    doc.circle(pageWidth / 2, y + 10, 10, "F");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`${habit.streak}d`, pageWidth / 2, y + 14, { align: "center" });

    y += 30;

    // Start Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Start Date: ${habit.startDate}`, pageWidth / 2, y, { align: "center" });

    y += 15;

    // Why
    const whyText = `Why: ${habit.why}`;
    const whyLines = doc.splitTextToSize(whyText, cardWidth - 40);
    const xPos = cardX + (cardWidth - Math.max(...whyLines.map(line => doc.getTextWidth(line)))) / 2;
    doc.text(whyLines, xPos, y);

    y += whyLines.length * 6 + 15;

    // Reflections
    if (habit.reflections && habit.reflections.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(234, 76, 137);
      doc.text("Reflections", pageWidth / 2, y, { align: "center" });

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);

      habit.reflections.forEach((reflection) => {
        const reflectionText = `${reflection.date}: ${reflection.text}`;
        const reflectionLines = doc.splitTextToSize(reflectionText, cardWidth - 40);

        // Page break if too low
        if (y + reflectionLines.length * 6 > pageHeight - 30) {
          doc.addPage();
          y = 30;
        }

        doc.text(reflectionLines, cardX + 10, y);
        y += reflectionLines.length * 6 + 4;
      });
    }

    // Footer
    doc.setDrawColor(255, 105, 180);
    doc.setLineWidth(0.5);
    doc.line(60, pageHeight - 26, pageWidth - 60, pageHeight - 26);

    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(11);
    doc.setTextColor(234, 76, 137);
    doc.text("HabitHub", pageWidth / 2, pageHeight - 20, { align: "center" });

    // Save file
    doc.save(`${habit.name.replace(/\s+/g, "_")}_Streak_Report.pdf`);
  });
}

// Expose to global scope
window.downloadPDF = downloadPDF;

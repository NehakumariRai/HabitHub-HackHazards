// ================== TAB SWITCHING ==================
document.getElementById("home-tab").addEventListener("click", () => {
    document.getElementById("home-section").classList.remove("hidden");
    document.getElementById("leisure-section").classList.add("hidden");

    document.getElementById("home-tab").classList.add("active");
    document.getElementById("leisure-tab").classList.remove("active");

    renderHabitCards(); // Refresh on tab switch
});

document.getElementById("leisure-tab").addEventListener("click", () => {
    document.getElementById("home-section").classList.add("hidden");
    document.getElementById("leisure-section").classList.remove("hidden");

    document.getElementById("home-tab").classList.remove("active");
    document.getElementById("leisure-tab").classList.add("active");

    loadLeisureContent();
});

function loadLeisureContent() {
    const leisureSection = document.getElementById("leisure-section");
    if (leisureSection.dataset.loaded) return;

    fetch(chrome.runtime.getURL("src/leisure.html"))
        .then((res) => res.text())
        .then((html) => {
            leisureSection.innerHTML = html;
            leisureSection.dataset.loaded = "true";
        })
        .catch((err) => {
            leisureSection.innerHTML = "<p>Failed to load leisure content.</p>";
            console.error("Leisure content load error:", err);
        });
}

// ================== MODAL HANDLING ==================
function showModal(contentHTML) {
    const overlay = document.getElementById("modalOverlay");
    const modal = document.getElementById("modalContent");

    modal.innerHTML = contentHTML;
    overlay.classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
    document.getElementById("modalContent").innerHTML = "";
}

// ================== MAKE HABIT ==================
document.getElementById("makeHabitBtn").addEventListener("click", () => {
    chrome.storage.local.get(["habits"], (result) => {
      const habits = result.habits || [];
      const lastHabit = habits[habits.length - 1];
  
      if (lastHabit && lastHabit.streak < 7) {
        alert("You need to complete the previous habit for 7 days before creating a new one.");
        return;
      }
  
      showModal(`
        <h2>Create a New Habit</h2>
        <input type="text" id="habitName" placeholder="Habit name" />
        <textarea id="habitWhy" placeholder="Why do you want this habit?"></textarea>
        <button id="submitHabitBtn">Create Habit</button>
        <button id="cancelCreateBtn">Cancel</button>
      `);
  
      document.getElementById("submitHabitBtn").addEventListener("click", submitHabit);
      document.getElementById("cancelCreateBtn").addEventListener("click", closeModal);
    });
  });
  
  function submitHabit() {
    const name = document.getElementById("habitName").value.trim();
    const why = document.getElementById("habitWhy").value.trim();
  
    if (!name || !why) {
      alert("Please fill out all fields.");
      return;
    }
  
    const habit = {
      id: Date.now(),
      name,
      why,
      streak: 0,
      startDate: new Date().toLocaleDateString(),
      lastCompletedDate: null,
      reflections: [],
    };
  
    chrome.storage.local.get(["habits"], (result) => {
      const habits = result.habits || [];
      habits.push(habit);
  
      chrome.storage.local.set({ habits }, () => {
        console.log("Habit saved:", habit);
  
        chrome.alarms.create(habit.name, {
          delayInMinutes: 60,
          periodInMinutes: 15
        });
  
        console.log("Alarm created for new habit:", habit.name);
  
        closeModal();
        renderHabitCards(); 
      });
    });
  }
  


// ================== RENDER HABIT CARDS ==================
function renderHabitCards() {
    const container = document.getElementById("habitCardsContainer");
    container.innerHTML = "";

    chrome.storage.local.get(["habits"], (result) => {
        const habits = result.habits || [];

        habits.forEach((habit) => {
            const card = document.createElement("div");
            card.className = "habit-card";
            card.innerHTML = `
              <h3>${habit.name}</h3>
              <p>Streak: ${habit.streak} day(s)</p>
              <button class="completed-btn" data-id="${habit.id}">Completed</button>
              <button class="share-btn" data-id="${habit.id}">Share</button>
            `;
            container.appendChild(card);

            card.querySelector(".completed-btn").addEventListener("click", () => markCompleted(habit.id));
            card.querySelector(".share-btn").addEventListener("click", () => openShareModal(habit.id));
        });
    });
}


// ================== MARK COMPLETED ==================
function markCompleted(id) {
    showModal(`
      <h3>Reflection</h3>
      <textarea id="reflectionInput" placeholder="How does it feel?"></textarea>
      <button id="saveReflectionBtn">Save</button>
      <button id="cancelReflectionBtn">Cancel</button>
    `);
  
    document.getElementById("saveReflectionBtn").addEventListener("click", () => saveReflection(id));
    document.getElementById("cancelReflectionBtn").addEventListener("click", closeModal);
  }
  
  function saveReflection(id) {
    chrome.storage.local.get(["habits"], (result) => {
      const habits = result.habits || [];
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
  
      const reflection = document.getElementById("reflectionInput").value.trim();
      const today = formatDate();
  
      if (reflection) {
        habit.reflections.push({
          date: today,
          text: reflection,
        });
      }
  
      if (habit.lastCompletedDate === today) {
        alert("You've already completed this habit today!");
        return;
      }
  
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);
  
      if (habit.lastCompletedDate === yesterdayStr) {
        habit.streak++;
      } else {
        if (habit.lastCompletedDate) {
          alert("You missed a day. Streak reset.");
        }
        habit.streak = 1;
      }
  
      habit.lastCompletedDate = today;
  
      chrome.storage.local.set({ habits }, () => {
        console.log("Habit updated with reflection and streak.");
        closeModal();
        renderHabitCards();
      });
    });
  }
  

// ================== SHARE HABIT ==================
function openShareModal(id) {
  chrome.storage.local.get(["habits"], (result) => {
    const habits = result.habits || [];
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    showModal(`
      <div class="share-preview">
        <h2>${habit.name}</h2>
        <p><strong>Streak:</strong> ${habit.streak} days</p>
        <p><strong>Start Date:</strong> ${habit.startDate}</p>
        <p><strong>Why:</strong> ${habit.why}</p>
        <p class="share-msg">“Discipline turns desire into identity.”</p>
        <button id="downloadPdfBtn">Download PDF</button>
        <button id="closeShareBtn">Close</button>
      </div>
    `);

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
      window.downloadPDF(id);
    });

    document.getElementById("closeShareBtn").addEventListener("click", closeModal);
  });
}

// ================== UTIL METHODS ==================
function getHabits() {
    const habits = localStorage.getItem("habits");
    return habits ? JSON.parse(habits) : [];
}

function saveHabits(habits) {
    localStorage.setItem("habits", JSON.stringify(habits));
}

function formatDate(date = new Date()) {
    return date.toISOString().split("T")[0];
}

// ================== INITIAL LOAD ==================
document.addEventListener("DOMContentLoaded", renderHabitCards);
   
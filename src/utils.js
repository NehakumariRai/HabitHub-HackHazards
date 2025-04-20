
function formatDate(date = new Date()) {
    return date.toISOString().split("T")[0];
  }
  
  
  function isNextDay(prevDateStr, currentDateStr) {
    const prev = new Date(prevDateStr);
    const current = new Date(currentDateStr);
  
    const diffTime = current - prev;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
    return diffDays === 1;
  }
  
  
  function getHabits() {
    const habits = localStorage.getItem("habits");
    return habits ? JSON.parse(habits) : [];
  }
  
  
  function saveHabits(habits) {
    localStorage.setItem("habits", JSON.stringify(habits));
  }
  
  
  function updateStreakById(habitId) {
    const habits = getHabits();
    const today = formatDate();
  
    const updated = habits.map((habit) => {
      if (habit.id === habitId) {
        const lastDone = habit.lastCompleted;
        if (lastDone && isNextDay(lastDone, today)) {
          habit.streak += 1;
        } else if (lastDone !== today) {
          habit.streak = 1;
        }
        habit.lastCompleted = today;
      }
      return habit;
    });
  
    saveHabits(updated);
  }
  
  
  function canAddNewHabit() {
    const habits = getHabits();
    if (habits.length === 0) return true;
  
    const latest = habits[habits.length - 1];
    return latest.streak >= 7;
  }
  
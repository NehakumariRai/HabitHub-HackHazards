const motivationalMessages = [
  "Do you really forget why you started?🧐🧐",
  "Don't you wanna grow?🤷‍♀️",
  "You are what you repeatedly do. Excellence is a habit!😌😌",
  "Every day is a new opportunity to achieve your goals.🎯",
  "Don't you wanna build a bridge between your goals and accomplishment?🏗️🌉",
  "You're doing great, don't you wanna keep moving?🚶‍➡️",
];

const flirtyMessages = [
  "You're making those habits look good just like you! Complete it plz 🥹",
  "Is it just me or do habits look even better when you’re doing them?😉😉😉",
  "You're on fire today! Take some time and complete your habit?😙😙",
  "I see you’re crushing your goals! Can I join you?🤗",
  "Don't you wanna impress the person waiting for you in mirror?🥹🥹",
  "This is your time to shine! Take a move yrr 😘",
];

function getRandomMessage() {
  const allMessages = [...motivationalMessages, ...flirtyMessages];
  const index = Math.floor(Math.random() * allMessages.length);
  return allMessages[index];
}


let snoozeClickCount = {};

function createNotification(title, message, habitName) {
  chrome.notifications.create(habitName, {
    type: "basic",
    iconUrl: "/public/icon.png", 
    title: title,
    message: message,
    priority: 2,
    buttons: [
      { title: "Visit" },
      { title: "Snooze" }
    ],
    requireInteraction: true, 
  }, (id) => {
    if (chrome.runtime.lastError) {
      console.error("Notification error:", chrome.runtime.lastError.message);
    }
  });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  const habitName = notificationId;

  if (buttonIndex === 0) {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/home.html") });
  } else if (buttonIndex === 1) {
    snoozeClickCount[habitName] = (snoozeClickCount[habitName] || 0) + 1;

    if (snoozeClickCount[habitName] === 1) {
      createNotification("Really want to leave?", getRandomMessage(), habitName);
    } else {
      chrome.notifications.clear(habitName);
      chrome.alarms.create(habitName, {
        delayInMinutes: 60, 
      });
      snoozeClickCount[habitName] = 0; 
    }
  }
});


function createAlarmsForHabits(habits) {
  habits.forEach(habit => {
    chrome.alarms.create(habit.name, {
      delayInMinutes: 60,
      periodInMinutes: 15,
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["habits"], (result) => {
    createAlarmsForHabits(result.habits || []);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["habits"], (result) => {
    createAlarmsForHabits(result.habits || []);
  });
});


chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(["habits"], (result) => {
    const habits = result.habits || [];
    const habit = habits.find(h => h.name === alarm.name);

    if (habit) {
      const today = new Date().toISOString().split("T")[0];
      if (habit.lastCompletedDate === today) return;

      snoozeClickCount[habit.name] = 0; 
      createNotification(
        `Habit to build: ${habit.name}`,
        `Why you started: ${habit.why}\nClick to mark as done or snooze for later.`,
        habit.name
      );
    }
  });
});

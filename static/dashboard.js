
const userColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

import { getDatabase, ref as dbRef, push, get, onChildAdded } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";


const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "mental-health-d6596.firebaseapp.com",
  projectId: "mental-health-d6596",
  storageBucket: "mental-health-d6596.firebasestorage.app",
  messagingSenderId: "827190774187",
  appId: "1:827190774187:web:1450ed5c595532c7076aee"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const usernameEl = document.getElementById("username");
const profilePic = document.getElementById("profile-pic");
const profileDropdown = document.getElementById("profile-dropdown");
const uploadOption = document.getElementById("upload-option");
const logoutBtn = document.getElementById("logout");
const uploadInput = document.getElementById("upload-pic");
const moodSelect = document.getElementById("mood-select");
const moodForm = document.getElementById("mood-form");
const journalForm = document.getElementById("journal-form");
const journalDatePicker = document.getElementById("journal-date-picker");
const journalText = document.getElementById("journal-text");
const journalView = document.getElementById("journal-view");
const moodChartCanvas = document.getElementById("mood-chart");
const prevWeekBtn = document.getElementById("prev-week");
const nextWeekBtn = document.getElementById("next-week");
const habitItems = document.querySelectorAll('.habit-item');
const currentStreakEl = document.getElementById('current-streak');
const dailyProgressEl = document.getElementById('daily-progress');
const progressPercentageEl = document.getElementById('progress-percentage');
const meditationModal = document.getElementById('meditation-modal');
const meditationSetup = document.getElementById('meditation-setup');
const meditationSession = document.getElementById('meditation-session');
const meditationComplete = document.getElementById('meditation-complete');
const closeMeditationBtn = document.querySelector('.close-meditation');
const meditationBtns = document.querySelectorAll('.meditation-btn');
const meditationTypes = document.querySelectorAll('.meditation-type');
const playPauseBtn = document.getElementById('play-pause-btn');
const stopMeditationBtn = document.getElementById('stop-meditation');
const meditationDoneBtn = document.getElementById('meditation-done');
const timerMinutesEl = document.getElementById('timer-minutes');
const timerSecondsEl = document.getElementById('timer-seconds');
const meditationTitleEl = document.getElementById('meditation-title');
const meditationInstructionEl = document.getElementById('meditation-instruction');
const breathingIndicator = document.getElementById('breathing-indicator');
const progressRingCircle = document.querySelector('.progress-ring-circle');



let currentUser = null;
let moodChart = null;
let currentWeekOffset = 0;
let currentHabits = {};
let habitStreak = 0;
let meditationTimer = null;
let meditationDuration = 0;
let meditationTimeLeft = 0;
let meditationPaused = false;
let currentMeditationType = '';



function createParticles() {
  const container = document.querySelector('.particles-container');

  function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 6 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
    particle.style.animationDelay = Math.random() * 5 + 's';

    container.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 25000);
  }

  
  for (let i = 0; i < 50; i++) {
    setTimeout(createParticle, i * 100);
  }

  
  setInterval(createParticle, 500);
}

const meditationInstructions = {
  'breathing': [
    "Take a deep breath in through your nose for 4 counts...",
    "Hold your breath gently for 4 counts...",
    "Exhale slowly through your mouth for 6 counts...",
    "Focus on the sensation of breathing...",
    "Let your thoughts come and go naturally...",
    "Return your attention to your breath..."
  ],
  'body-scan': [
    "Start by noticing your toes... feel any sensations...",
    "Move your attention to your feet and ankles...",
    "Feel your calves and shins... notice any tension...",
    "Bring awareness to your thighs and hips...",
    "Notice your lower back and abdomen...",
    "Feel your chest and shoulders...",
    "Bring attention to your arms and hands...",
    "Notice your neck and jaw...",
    "Feel your face and the top of your head..."
  ],
  'mindfulness': [
    "Notice the present moment without judgment...",
    "Observe your thoughts like clouds passing by...",
    "Feel your body in this space...",
    "Listen to the sounds around you...",
    "Notice any emotions that arise...",
    "Accept whatever you're experiencing...",
    "Return to the present moment..."
  ],
  'loving-kindness': [
    "Begin by sending love to yourself...",
    "May I be happy, may I be healthy...",
    "Now think of someone you love...",
    "Send them loving thoughts and wishes...",
    "Think of someone neutral to you...",
    "Extend the same loving kindness to them...",
    "Even send love to someone difficult...",
    "Finally, send love to all beings everywhere..."
  ]
};

async function initializeHabitTracker() {
  console.log('Initializing habit tracker...');

  initializeDefaultHabits();

  
  await loadTodayHabits();

  
  addHabitEventListeners();

  
  addMeditationEventListeners();

  
  updateHabitProgress();

  
  await testFirestoreConnection();

  
  await loadHabitStreak();

}


async function testFirestoreConnection() {
  try {
    console.log('Testing Firestore connection...');
    console.log('Current user:', currentUser);
    console.log('Database instance:', db);

    const testDoc = doc(db, "users", currentUser.uid, "test", "connection");
    const testData = {
      timestamp: Timestamp.now(),
      test: true,
      userAgent: navigator.userAgent,
      userId: currentUser.uid
    };

    console.log('Attempting to write test document:', testData);
    await setDoc(testDoc, testData);

    
    const readBack = await getDoc(testDoc);
    if (readBack.exists()) {
      console.log('Firestore connection successful! Data:', readBack.data());
      return true;
    } else {
      console.error('Write succeeded but read failed');
      return false;
    }
  } catch (error) {
    console.error('Firestore connection failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}


function addHabitEventListeners() {
  
  document.querySelectorAll('.toggle-habit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const habitItem = e.target.closest('.habit-item');
      const habitType = habitItem.dataset.habit;
      const target = e.target.dataset.target;

      if (habitType === 'hydration') return; 

      let value = 0;
      if (habitType === 'sleep') {
        value = parseFloat(habitItem.querySelector('.sleep-hours').value) || 0;
      } else if (habitType === 'exercise') {
        value = parseFloat(habitItem.querySelector('.exercise-minutes').value) || 0;
      } else if (habitType === 'meditation') {
        value = currentHabits[habitType]?.value || 0;
      }

      const completed = target ? value >= parseFloat(target) : !currentHabits[habitType]?.completed;

      await updateHabit(habitType, value, completed);
    });
  });

  
  document.querySelectorAll('.add-glass').forEach(btn => {
    btn.addEventListener('click', async () => {
      const current = currentHabits.hydration?.value || 0;
      
      if (current >= 8) {
        showMessage('Daily hydration goal already achieved! 💧', 'info');
        return;
      }
      const newValue = current + 1;
      await updateHabit('hydration', newValue, newValue >= 8);
    });
  });

  document.querySelectorAll('.remove-glass').forEach(btn => {
    btn.addEventListener('click', async () => {
      const current = currentHabits.hydration?.value || 0;
      const newValue = Math.max(current - 1, 0);
      await updateHabit('hydration', newValue, newValue >= 8);
    });
  });

  
  document.querySelectorAll('.sleep-hours, .exercise-minutes').forEach(input => {
    input.addEventListener('input', async (e) => {
      const habitItem = e.target.closest('.habit-item');
      const habitType = habitItem.dataset.habit;
      const value = parseFloat(e.target.value) || 0;
      const target = habitType === 'sleep' ? 7 : 30;
      const completed = value >= target;

      await updateHabit(habitType, value, completed);
    });
  });

  
  document.querySelectorAll('.meditation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const duration = parseInt(btn.dataset.duration);
      startQuickMeditation(duration);
    });
  });
}


function addMeditationEventListeners() {
  
  closeMeditationBtn.addEventListener('click', closeMeditationModal);

  
  meditationModal.addEventListener('click', (e) => {
    if (e.target === meditationModal) {
      closeMeditationModal();
    }
  });

  
  meditationTypes.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const duration = parseInt(btn.dataset.duration);
      startGuidedMeditation(type, duration);
    });
  });

  
  playPauseBtn.addEventListener('click', toggleMeditationPause);

  
  stopMeditationBtn.addEventListener('click', stopMeditation);

  
  meditationDoneBtn.addEventListener('click', closeMeditationModal);
}

function initializeDefaultHabits() {
  if (!currentHabits || Object.keys(currentHabits).length === 0) {
    currentHabits = {
      hydration: { value: 0, completed: false },
      sleep: { value: 0, completed: false },
      exercise: { value: 0, completed: false },
      meditation: { value: 0, completed: false }
    };
    console.log('Initialized default habits:', currentHabits);
  }
}


async function loadTodayHabits() {
  console.log('Loading today habits for user:', currentUser?.uid);

  if (!currentUser) {
    console.error('No current user available');
    initializeDefaultHabits();
    updateHabitDisplay();
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Loading habits for date:', today);

    
    const habitsRef = doc(db, "users", currentUser.uid, "habits", today);
    const habitsSnap = await getDoc(habitsRef);

    if (habitsSnap.exists()) {
      console.log('Found habits in Firestore:', habitsSnap.data());
      currentHabits = habitsSnap.data().habits || {};

      
      const defaultHabits = {
        hydration: { value: 0, completed: false },
        sleep: { value: 0, completed: false },
        exercise: { value: 0, completed: false },
        meditation: { value: 0, completed: false }
      };

      
      currentHabits = { ...defaultHabits, ...currentHabits };

    } else {
      console.log('No habits found in Firestore, initializing defaults');
      initializeDefaultHabits();
    }

    
    updateHabitDisplay();
    updateHabitProgress();

  } catch (error) {
    console.error('Error loading habits:', error);
    initializeDefaultHabits();
    updateHabitDisplay();
    updateHabitProgress();
    showMessage('Using offline mode - data will sync when connection is restored', 'warning');
  }
}


async function updateHabit(habitType, value, completed) {
  try {
    
    const wasAllCompleted = areAllHabitsCompleted();

    
    currentHabits[habitType] = { value, completed };

    
    updateHabitDisplay();
    updateHabitProgress();

    const today = new Date().toISOString().split('T')[0];

    console.log('Saving habit to Firestore:', { habitType, value, completed, today });

    try {
      
      const habitRef = doc(db, "users", currentUser.uid, "habitEntries", `${today}_${habitType}`);
      await setDoc(habitRef, {
        type: habitType,
        value: value,
        completed: completed,
        date: today,
        updatedAt: Timestamp.now(),
        userId: currentUser.uid
      });

      
      const summaryRef = doc(db, "users", currentUser.uid, "habits", today);
      await setDoc(summaryRef, {
        habits: currentHabits,
        date: today,
        updatedAt: Timestamp.now(),
        userId: currentUser.uid
      }, { merge: true });

      console.log('Successfully saved to Firestore');

    } catch (firestoreError) {
      console.error('Firestore save failed:', firestoreError);
      showMessage('Failed to save to cloud, using local storage', 'error');

      
      const habitData = JSON.parse(localStorage.getItem(`habits_${currentUser.uid}`) || '{}');
      habitData[today] = currentHabits;
      localStorage.setItem(`habits_${currentUser.uid}`, JSON.stringify(habitData));
    }

    
    const isNowAllCompleted = areAllHabitsCompleted();
    if (isNowAllCompleted && !wasAllCompleted) {
      console.log('All habits completed for the first time today - updating streak');
      await updateHabitStreak();
    }

    
    if (completed) {
      addHabitCompletionAnimation(habitType);
    }

  } catch (error) {
    console.error('Error updating habit:', error);
    showMessage('Error saving habit progress', 'error');
  }
}


function updateHabitDisplay() {
  console.log('Updating habit display with:', currentHabits);

  
  const hydrationItem = document.querySelector('.habit-item[data-habit="hydration"]');
  if (hydrationItem) {
    const glassesCount = hydrationItem.querySelector('.glasses-count');
    const value = currentHabits.hydration?.value || 0;
    if (glassesCount) {
      glassesCount.textContent = `${value}/8`;
    }

    if (currentHabits.hydration?.completed) {
      hydrationItem.classList.add('completed');
    } else {
      hydrationItem.classList.remove('completed');
    }
  }

  
  const sleepItem = document.querySelector('.habit-item[data-habit="sleep"]');
  if (sleepItem) {
    const sleepInput = sleepItem.querySelector('.sleep-hours');
    const sleepButton = sleepItem.querySelector('.toggle-habit');
    const value = currentHabits.sleep?.value || 0;

    if (sleepInput && value > 0) sleepInput.value = value;

    if (currentHabits.sleep?.completed) {
      sleepItem.classList.add('completed');
      if (sleepButton) sleepButton.classList.add('completed');
    } else {
      sleepItem.classList.remove('completed');
      if (sleepButton) sleepButton.classList.remove('completed');
    }
  }

  
  const exerciseItem = document.querySelector('.habit-item[data-habit="exercise"]');
  if (exerciseItem) {
    const exerciseInput = exerciseItem.querySelector('.exercise-minutes');
    const exerciseButton = exerciseItem.querySelector('.toggle-habit');
    const value = currentHabits.exercise?.value || 0;

    if (exerciseInput && value > 0) exerciseInput.value = value;

    if (currentHabits.exercise?.completed) {
      exerciseItem.classList.add('completed');
      if (exerciseButton) exerciseButton.classList.add('completed');
    } else {
      exerciseItem.classList.remove('completed');
      if (exerciseButton) exerciseButton.classList.remove('completed');
    }
  }

  
  const meditationItem = document.querySelector('.habit-item[data-habit="meditation"]');
  if (meditationItem) {
    const meditationButton = meditationItem.querySelector('.toggle-habit');

    if (currentHabits.meditation?.completed) {
      meditationItem.classList.add('completed');
      if (meditationButton) meditationButton.classList.add('completed');
    } else {
      meditationItem.classList.remove('completed');
      if (meditationButton) meditationButton.classList.remove('completed');
    }
  }
}


function updateHabitProgress() {
  const totalHabits = 4;
  const completedHabits = Object.values(currentHabits).filter(habit => habit.completed).length;
  const percentage = Math.round((completedHabits / totalHabits) * 100);

  
  if (dailyProgressEl) {
    dailyProgressEl.style.width = `${percentage}%`;
  }

  
  if (progressPercentageEl) {
    progressPercentageEl.textContent = `${percentage}%`;
  }
}


function areAllHabitsCompleted() {
  return Object.values(currentHabits).every(habit => habit.completed);
}


async function loadHabitStreak() {
  try {
    console.log('Loading habit streak for user:', currentUser.uid);

    
    const streakRef = doc(db, "users", currentUser.uid, "profile", "streak");
    const streakSnap = await getDoc(streakRef);

    if (streakSnap.exists()) {
      habitStreak = streakSnap.data().currentStreak || 0;
      console.log('Loaded streak from Firestore:', habitStreak);
    } else {
      console.log('No streak found in Firestore, starting fresh');
      habitStreak = 0;
    }

    
    if (currentStreakEl) {
      currentStreakEl.textContent = habitStreak;
    }

  } catch (error) {
    console.error('Error loading habit streak:', error);
    habitStreak = 0;
    if (currentStreakEl) {
      currentStreakEl.textContent = '0';
    }
  }
}


async function updateHabitStreak() {
  try {
    const today = new Date().toISOString().split('T')[0];

    
    let streakData = null;
    try {
      const streakRef = doc(db, "users", currentUser.uid, "profile", "streak");
      const streakSnap = await getDoc(streakRef);

      if (streakSnap.exists()) {
        streakData = streakSnap.data();
        if (streakData.lastUpdated === today) {
          console.log('Streak already updated today');
          return;
        }
      }
    } catch (error) {
      console.warn('Could not check existing streak data');
    }

    let newStreak = 1;
    let streakBroken = false;
    let daysMissed = 0;
    let previousStreak = streakData?.currentStreak || 0;

    
    if (streakData && streakData.lastUpdated) {
      const lastUpdateDate = new Date(streakData.lastUpdated);
      const todayDate = new Date(today);
      const daysDifference = Math.floor((todayDate - lastUpdateDate) / (24 * 60 * 60 * 1000));

      console.log('Days difference:', daysDifference); 

      if (daysDifference === 1) {
        newStreak = previousStreak + 1;
      } else if (daysDifference > 1) {
        streakBroken = true;
        daysMissed = daysDifference - 1;
        newStreak = 1;
      }
      
    }
    

    if (sessionStorage.getItem('forceStreakReset') === 'true') {
      console.log('Force reset applied, restarting streak at 1');
      habitStreak = 1;
      sessionStorage.removeItem('forceStreakReset');
    } else {
      habitStreak = newStreak;
    }


    
    try {
      const streakRef = doc(db, "users", currentUser.uid, "profile", "streak");
      await setDoc(streakRef, {
        currentStreak: habitStreak,
        lastUpdated: today,
        updatedAt: Timestamp.now(),
        totalDaysCompleted: (streakData?.totalDaysCompleted || 0) + 1
      }, { merge: true });
    } catch (firestoreError) {
      localStorage.setItem(`habitStreak_${currentUser.uid}`, habitStreak.toString());
      localStorage.setItem(`habitStreakDate_${currentUser.uid}`, today);
    }

    
    if (currentStreakEl) {
      currentStreakEl.textContent = habitStreak;
    }

    
    if (streakBroken && previousStreak > 0) {
      if (daysMissed === 1) {
        showCenteredNotification(`💔 Your ${previousStreak}-day streak was broken by missing yesterday. Starting fresh with day 1! 💪`, 'warning');
      } else {
        showCenteredNotification(`💔 Your ${previousStreak}-day streak was broken after missing ${daysMissed} days. Back to day 1 - you've got this! 🌟`, 'warning');
      }
    } else if (habitStreak % 7 === 0 && habitStreak > 0) {
      showCenteredNotification(`🎉 ${habitStreak} day streak! Amazing consistency!`, 'success');
    } else if (habitStreak > 1) {
      showCenteredNotification(`🔥 ${habitStreak} day streak!`, 'success');
    } else {
      showCenteredNotification(`🌟 Great job completing all habits today!`, 'success');
    }

  } catch (error) {
    console.error('Error updating habit streak:', error);
  }
}

async function checkMissedDays() {
  const userDocRef = doc(db, "users", currentUser.uid, "profile", "activity");
  const userDoc = await getDoc(userDocRef);

  const today = new Date().toISOString().split('T')[0];
  const lastActive = userDoc.exists() ? userDoc.data().lastActiveDate : null;

  if (lastActive && lastActive !== today) {
    const lastDate = new Date(lastActive);
    const currentDate = new Date(today);
    const daysMissed = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayHabitsRef = doc(db, "users", currentUser.uid, "habits", yesterdayStr);
    const yesterdayHabitsSnap = await getDoc(yesterdayHabitsRef);

    let allCompleted = false;
    if (yesterdayHabitsSnap.exists()) {
      const habits = yesterdayHabitsSnap.data().habits || {};
      allCompleted = Object.values(habits).every(habit => habit.completed);
    }

    if ((!allCompleted || daysMissed > 1) && !sessionStorage.getItem('missedDayNotified')) {
      showCenteredNotification(`⚡ You missed ${daysMissed} day(s) or didn’t complete all habits yesterday. Your streak will restart after today’s completion.`, 'warning');
      sessionStorage.setItem('missedDayNotified', 'true');
      sessionStorage.setItem('forceStreakReset', 'true');
    }
  }

  
  await setDoc(userDocRef, { lastActiveDate: today }, { merge: true });
}


function addHabitCompletionAnimation(habitType) {
  const habitItem = document.querySelector(`.habit-item[data-habit="${habitType}"]`);
  if (habitItem) {
    
    const sparkle = document.createElement('div');
    sparkle.innerHTML = '✨';
    sparkle.style.position = 'absolute';
    sparkle.style.fontSize = '2rem';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.animation = 'sparkle 1s ease-out forwards';
    sparkle.style.zIndex = '1000';

    const rect = habitItem.getBoundingClientRect();
    sparkle.style.left = `${rect.right - 50}px`;
    sparkle.style.top = `${rect.top + 10}px`;

    document.body.appendChild(sparkle);

    
    setTimeout(() => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
    }, 1000);
  }
}


function startQuickMeditation(duration) {
  currentMeditationType = 'quick';
  meditationDuration = duration * 60; 
  meditationTimeLeft = meditationDuration;

  showMeditationModal();
  showMeditationSession();
  startMeditationTimer();

  
  meditationTitleEl.textContent = `${duration} Minute Meditation`;
  meditationInstructionEl.textContent = 'Close your eyes and focus on your breathing...';
}


function startGuidedMeditation(type, duration) {
  currentMeditationType = type;
  meditationDuration = duration * 60; 
  meditationTimeLeft = meditationDuration;

  showMeditationSession();
  startMeditationTimer();
  startGuidedInstructions(type);

  
  const titles = {
    'breathing': 'Breathing Focus',
    'body-scan': 'Body Scan Meditation',
    'mindfulness': 'Mindfulness Meditation',
    'loving-kindness': 'Loving Kindness Meditation'
  };

  meditationTitleEl.textContent = titles[type] || 'Meditation';
}


function startGuidedInstructions(type) {
  const instructions = meditationInstructions[type] || meditationInstructions.breathing;
  let currentInstruction = 0;
  const instructionInterval = Math.floor(meditationDuration / instructions.length);

  
  meditationInstructionEl.textContent = instructions[0];

  
  const instructionTimer = setInterval(() => {
    if (meditationTimer && !meditationPaused && currentInstruction < instructions.length - 1) {
      currentInstruction++;
      meditationInstructionEl.textContent = instructions[currentInstruction];
    } else if (!meditationTimer) {
      clearInterval(instructionTimer);
    }
  }, instructionInterval * 1000);
}


function showMeditationModal() {
  meditationModal.classList.add('show');
  document.body.style.overflow = 'hidden';
}


function closeMeditationModal() {
  meditationModal.classList.remove('show');
  document.body.style.overflow = 'auto';

  
  if (meditationTimer) {
    stopMeditation();
  }

  
  meditationSetup.style.display = 'block';
  meditationSession.style.display = 'none';
  meditationComplete.style.display = 'none';
}


function showMeditationSession() {
  meditationSetup.style.display = 'none';
  meditationSession.style.display = 'block';
  meditationComplete.style.display = 'none';
}


function startMeditationTimer() {
  
  if (meditationTimer) {
    clearInterval(meditationTimer);
  }

  meditationPaused = false;
  playPauseBtn.textContent = '⏸️ Pause';

  
  const circumference = 2 * Math.PI * 54; 
  progressRingCircle.style.strokeDasharray = circumference;
  progressRingCircle.style.strokeDashoffset = 0;

  
  const minutes = Math.floor(meditationTimeLeft / 60);
  const seconds = meditationTimeLeft % 60;
  timerMinutesEl.textContent = minutes.toString().padStart(2, '0');
  timerSecondsEl.textContent = seconds.toString().padStart(2, '0');

  meditationTimer = setInterval(() => {
    if (!meditationPaused && meditationTimeLeft > 0) {
      meditationTimeLeft--;

      
      const minutes = Math.floor(meditationTimeLeft / 60);
      const seconds = meditationTimeLeft % 60;
      timerMinutesEl.textContent = minutes.toString().padStart(2, '0');
      timerSecondsEl.textContent = seconds.toString().padStart(2, '0');

      
      const progress = (meditationDuration - meditationTimeLeft) / meditationDuration;
      const offset = circumference * (1 - progress);
      progressRingCircle.style.strokeDashoffset = offset;

      
      if (meditationTimeLeft <= 0) {
        completeMeditation();
      }
    }
  }, 1000);
}



function toggleMeditationPause() {
  if (meditationTimer) {
    meditationPaused = !meditationPaused;
    playPauseBtn.textContent = meditationPaused ? '▶️ Resume' : '⏸️ Pause';
  }
}


function stopMeditation() {
  if (meditationTimer) {
    clearInterval(meditationTimer);
    meditationTimer = null;
  }

  
  meditationPaused = false;
  playPauseBtn.textContent = '▶️ Play';

  
  meditationSetup.style.display = 'block';
  meditationSession.style.display = 'none';
  meditationComplete.style.display = 'none';
}


async function completeMeditation() {
  if (meditationTimer) {
    clearInterval(meditationTimer);
    meditationTimer = null;
  }

  
  meditationSession.style.display = 'none';
  meditationComplete.style.display = 'block';

  
  const meditationTime = Math.floor((meditationDuration - meditationTimeLeft) / 60);
  const currentValue = currentHabits.meditation?.value || 0;
  await updateHabit('meditation', currentValue + meditationTime, true);

  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    
    setTimeout(() => {
      audioContext.close();
    }, 600);

  } catch (error) {
    console.log('Audio not available, skipping completion sound');
  }

  
  showNotification('🧘 Meditation completed! Great job!', 'success');
}


function addSparkleAnimation() {
  if (!document.getElementById('sparkle-animation')) {
    const style = document.createElement('style');
    style.id = 'sparkle-animation';
    style.textContent = `
      @keyframes sparkle {
        0% {
          transform: scale(0) rotate(0deg);
          opacity: 1;
        }
        50% {
          transform: scale(1.2) rotate(180deg);
          opacity: 1;
        }
        100% {
          transform: scale(0) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard DOM loaded');

  
  if (!auth.currentUser) {
    
    console.log('Waiting for authentication...');
  }
});


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeHabitTracker,
    updateHabit,
    startQuickMeditation,
    startGuidedMeditation
  };
}


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    
    currentUser = { uid: 'demo-user', email: 'demo@example.com' };
    usernameEl.textContent = 'demo';
  } else {
    currentUser = user;
    usernameEl.textContent = user.email.split("@")[0];
  }

  
  const today = new Date().toISOString().split("T")[0];
  journalDatePicker.value = today;

  await loadUserData();
  await checkMissedDays();
  await fetchAISuggestions(currentUser.uid);
  
  addSparkleAnimation();
  console.log('Initializing habit tracker for user:', currentUser.uid);
  await initializeHabitTracker(); 

  createParticles();
});


profilePic.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown.classList.remove("hidden");
  profileDropdown.classList.add("show");
});


document.addEventListener("click", (e) => {
  if (!profileDropdown.contains(e.target) && e.target !== profilePic) {
    profileDropdown.classList.remove("show");
    profileDropdown.classList.add("hidden");
  }
});



uploadOption.addEventListener("click", () => {
  uploadInput.click();
  profileDropdown.classList.remove("show");
  profileDropdown.classList.add("hidden");
});


logoutBtn.addEventListener("click", async () => {
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
    showMessage("Logged out successfully!", "success");
    setTimeout(() => window.location.href = "/", 500);
  } catch (error) {
    showMessage("Error logging out: " + error.message, "error");
  }
});


uploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  
  if (!file.type.startsWith('image/')) {
    showMessage("Please select a valid image file", "error");
    
    uploadInput.value = '';
    return;
  }

  
  if (file.size > 5 * 1024 * 1024) {
    showMessage("File size must be less than 5MB", "error");
    
    uploadInput.value = '';
    return;
  }

  
  showMessage("Uploading profile photo...", "info");

  try {
    
    const photoURL = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    console.log("Photo converted to base64, size:", photoURL.length);

    
    profilePic.src = photoURL;



    
    const userData = {
      uid: currentUser.uid,
      email: currentUser.email || 'demo@example.com',
      displayName: currentUser.displayName || usernameEl.textContent,
      photoURL: photoURL,
      updatedAt: Timestamp.now(),
      lastPhotoUpdate: new Date().toISOString(),
      photoSize: photoURL.length,
      fileName: file.name,
      fileType: file.type,
      uploadCount: (await getUserUploadCount()) + 1 
    };

    console.log("Saving to Firestore:", {
      uid: userData.uid,
      email: userData.email,
      photoSize: userData.photoSize,
      fileName: userData.fileName,
      uploadCount: userData.uploadCount
    });

    
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, userData, { merge: true });

    console.log("Successfully saved to Firestore");

    
    localStorage.setItem(`profilePhoto_${currentUser.uid}`, photoURL);

    
    const verificationDoc = await getDoc(userDocRef);
    if (verificationDoc.exists() && verificationDoc.data().photoURL) {
      console.log("Verification successful - photo found in database");
      showMessage("Profile photo uploaded successfully!", "success");
    } else {
      throw new Error("Verification failed - photo not found in database");
    }

    
    uploadInput.value = '';

  } catch (error) {
    console.error("Error uploading photo:", error);
    showMessage("Error uploading photo: " + error.message, "error");

    
    uploadInput.value = '';

    
    await loadProfilePicture();
  }
});


async function getUserUploadCount() {
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().uploadCount) {
      return userDoc.data().uploadCount;
    }
    return 0;
  } catch (error) {
    console.error("Error getting upload count:", error);
    return 0;
  }
}


moodForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mood = moodSelect.value;
  if (!mood) {
    showMessage("Please select a mood", "error");
    return;
  }

  try {
    const date = new Date().toISOString().split("T")[0];

    
    const moodData = JSON.parse(localStorage.getItem(`moods_${currentUser.uid}`) || '{}');
    moodData[date] = {
      mood,
      timestamp: new Date().toISOString(),
      date
    };
    localStorage.setItem(`moods_${currentUser.uid}`, JSON.stringify(moodData));

    
    await setDoc(doc(db, "users", currentUser.uid, "moods", date), {
      mood,
      timestamp: Timestamp.now(),
      date,
      uid: currentUser.uid
    });

    await fetchAISuggestions(currentUser.uid);

    showMessage("Mood saved successfully!", "success");
    moodSelect.value = "";
    await loadMoodChart();
  } catch (error) {
    showMessage("Error saving mood: " + error.message, "error");
  }
});


journalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const selectedDate = journalDatePicker.value;
  const text = journalText.value.trim();

  if (!text) {
    showMessage("Please write something in your journal", "error");
    return;
  }

  try {
    
    const journalData = JSON.parse(localStorage.getItem(`journals_${currentUser.uid}`) || '{}');
    journalData[selectedDate] = {
      text,
      timestamp: new Date().toISOString(),
      date: selectedDate
    };
    localStorage.setItem(`journals_${currentUser.uid}`, JSON.stringify(journalData));

    
    await setDoc(doc(db, "users", currentUser.uid, "journals", selectedDate), {
      text,
      timestamp: Timestamp.now(),
      date: selectedDate,
      uid: currentUser.uid
    });

    showMessage("Journal entry saved!", "success");
    await loadJournalEntries();
  } catch (error) {
    showMessage("Error saving journal: " + error.message, "error");
  }
});


journalDatePicker.addEventListener("change", async () => {
  const selectedDate = journalDatePicker.value;
  const today = new Date().toISOString().split("T")[0];

  if (selectedDate === today) {
    journalText.disabled = false;
    journalText.placeholder = "Write your thoughts for today...";
  } else {
    journalText.disabled = true;
    journalText.placeholder = "You can only edit today's journal entry";
  }

  await loadJournalEntry(selectedDate);
});


prevWeekBtn.addEventListener("click", () => {
  currentWeekOffset++;
  loadMoodChart();
});

nextWeekBtn.addEventListener("click", () => {
  if (currentWeekOffset > 0) {
    currentWeekOffset--;
    loadMoodChart();
  }
});


async function loadUserData() {
  await Promise.all([
    loadProfilePicture(),
    loadMoodChart(),
    loadJournalEntries(),
    loadTodayJournal()
  ]);
}


async function loadProfilePicture() {
  try {
    console.log("Loading profile picture for user:", currentUser.uid);

    
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("User document found in Firestore");

      if (userData.photoURL) {
        console.log("Photo URL found in database, loading...");
        profilePic.src = userData.photoURL;
        
        localStorage.setItem(`profilePhoto_${currentUser.uid}`, userData.photoURL);
        console.log("Profile picture loaded successfully from Firestore");
        return;
      }
    }

    
    const cachedPhoto = localStorage.getItem(`profilePhoto_${currentUser.uid}`);
    if (cachedPhoto) {
      console.log("Loading profile picture from localStorage cache");
      profilePic.src = cachedPhoto;
    } else {
      console.log("No profile picture found, using default");
    }

  } catch (error) {
    console.error("Error loading profile picture:", error);

    
    const cachedPhoto = localStorage.getItem(`profilePhoto_${currentUser.uid}`);
    if (cachedPhoto) {
      console.log("Using localStorage fallback due to error");
      profilePic.src = cachedPhoto;
    }
  }
}


async function loadTodayJournal() {
  const today = new Date().toISOString().split("T")[0];
  await loadJournalEntry(today);
}


async function loadJournalEntry(date) {
  try {
    let journalText_value = "";

    
    const journalRef = doc(db, "users", currentUser.uid, "journals", date);
    const journalSnap = await getDoc(journalRef);

    if (journalSnap.exists()) {
      journalText_value = journalSnap.data().text;
    } else {
      
      const journalData = JSON.parse(localStorage.getItem(`journals_${currentUser.uid}`) || '{}');
      if (journalData[date]) {
        journalText_value = journalData[date].text;
      }
    }

    journalText.value = journalText_value;

  } catch (error) {
    console.error("Error loading journal entry:", error);

    
    const journalData = JSON.parse(localStorage.getItem(`journals_${currentUser.uid}`) || '{}');
    journalText.value = journalData[date] ? journalData[date].text : "";
  }
}


async function loadJournalEntries() {
  try {
    let allEntries = [];

    
    const journalsRef = collection(db, "users", currentUser.uid, "journals");
    const q = query(journalsRef, orderBy("date", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        allEntries.push(doc.data());
      });
    } else {
      
      const journalData = JSON.parse(localStorage.getItem(`journals_${currentUser.uid}`) || '{}');
      allEntries = Object.values(journalData).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    }

    journalView.innerHTML = "";

    if (allEntries.length === 0) {
      journalView.innerHTML = `
        <div class="journal-entry">
          <div class="journal-content">No journal entries yet. Start writing your first entry!</div>
        </div>
      `;
      return;
    }

    allEntries.forEach((data) => {
      const entryElement = document.createElement("div");
      entryElement.className = "journal-entry";
      entryElement.innerHTML = `
        <div class="journal-date">${formatDate(data.date)}</div>
        <div class="journal-content">${data.text}</div>
      `;
      journalView.appendChild(entryElement);
    });

  } catch (error) {
    console.error("Error loading journal entries:", error);

    
    const journalData = JSON.parse(localStorage.getItem(`journals_${currentUser.uid}`) || '{}');
    const entries = Object.values(journalData).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    journalView.innerHTML = "";

    if (entries.length === 0) {
      journalView.innerHTML = `
        <div class="journal-entry">
          <div class="journal-content">No journal entries yet. Start writing your first entry!</div>
        </div>
      `;
    } else {
      entries.forEach((data) => {
        const entryElement = document.createElement("div");
        entryElement.className = "journal-entry";
        entryElement.innerHTML = `
          <div class="journal-date">${formatDate(data.date)}</div>
          <div class="journal-content">${data.text}</div>
        `;
        journalView.appendChild(entryElement);
      });
    }
  }
}


async function loadMoodChart() {
  try {
    let allMoods = [];

    
    const moodsRef = collection(db, "users", currentUser.uid, "moods");
    const q = query(moodsRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        allMoods.push(doc.data());
      });
    } else {
      
      const moodData = JSON.parse(localStorage.getItem(`moods_${currentUser.uid}`) || '{}');
      allMoods = Object.values(moodData).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    
    const startIndex = Math.max(0, allMoods.length - 7 - (currentWeekOffset * 7));
    const endIndex = Math.max(7, allMoods.length - (currentWeekOffset * 7));
    const weekMoods = allMoods.slice(startIndex, endIndex);

    
    nextWeekBtn.disabled = currentWeekOffset === 0;
    prevWeekBtn.disabled = startIndex === 0;

    const labels = weekMoods.map(mood => formatDate(mood.date));
    const moodValues = weekMoods.map(mood => getMoodValue(mood.mood));

    
    if (moodChart) {
      moodChart.destroy();
    }

    
    const ctx = moodChartCanvas.getContext("2d");
    moodChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mood Level',
          data: moodValues,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00d4ff',
          pointBorderColor: '#ffffff',
          pointRadius: 6,
          pointHoverRadius: 10,
          pointHitRadius: 20,
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false,
          axis: 'x' 
        },
        hover: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const moodNames = ['', 'Angry', 'Sad', 'Anxious', 'Tired', 'Calm', 'Content', 'Happy', 'Peaceful', 'Excited', 'Energetic'];
                return `Mood: ${moodNames[context.parsed.y]} (${context.parsed.y}/10)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)'
            }
          },
          y: {
            min: 0,
            max: 10,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              stepSize: 1,
              color: 'rgba(255, 255, 255, 0.8)',
              callback: function (value) {
                const moodLabels = ['😡', '😢', '😰', '😴', '😌', '😊', '😀', '😇', '🤩', '⚡'];
                return moodLabels[value - 1] || '';
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error loading mood chart:", error);

    
    const moodData = JSON.parse(localStorage.getItem(`moods_${currentUser.uid}`) || '{}');
    const allMoods = Object.values(moodData).sort((a, b) => new Date(a.date) - new Date(b.date));

    const startIndex = Math.max(0, allMoods.length - 7 - (currentWeekOffset * 7));
    const endIndex = Math.max(7, allMoods.length - (currentWeekOffset * 7));
    const weekMoods = allMoods.slice(startIndex, endIndex);

    nextWeekBtn.disabled = currentWeekOffset === 0;
    prevWeekBtn.disabled = startIndex === 0;

    const labels = weekMoods.map(mood => formatDate(mood.date));
    const moodValues = weekMoods.map(mood => getMoodValue(mood.mood));

    if (moodChart) {
      moodChart.destroy();
    }

    const ctx = moodChartCanvas.getContext("2d");
    moodChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mood Level',
          data: moodValues,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00d4ff',
          pointBorderColor: '#ffffff',
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)'
            }
          },
          y: {
            min: 0,
            max: 10,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              stepSize: 1,
              color: 'rgba(255, 255, 255, 0.8)'
            }
          }
        }
      }
    });
  }
}


function getMoodValue(mood) {
  const moodMap = {
    'angry': 1,
    'sad': 2,
    'anxious': 3,
    'tired': 4,
    'calm': 5,
    'content': 6,
    'happy': 7,
    'peaceful': 8,
    'excited': 9,
    'energetic': 10
  };
  return moodMap[mood] || 5;
}


function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}


function showMessage(message, type = 'info') {
  
  const existingMessages = document.querySelectorAll('.message');
  existingMessages.forEach(msg => msg.remove());

  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${type}`;
  messageElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    animation: slideIn 0.3s ease-out;
  `;

  
  switch (type) {
    case 'success':
      messageElement.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      break;
    case 'error':
      messageElement.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      break;
    default:
      messageElement.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
  }

  messageElement.textContent = message;

  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(messageElement);

  
  setTimeout(() => {
    messageElement.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => messageElement.remove(), 300);
  }, 5000);
}


document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard initialized');

  
  console.log('Firebase app:', app);
  console.log('Firestore instance:', db);
  console.log('Auth instance:', auth);

  
  if (!currentUser) {
    setTimeout(() => {
      currentUser = {
        uid: 'demo-user-' + Date.now(), 
        email: 'demo@example.com'
      };
      usernameEl.textContent = 'demo';

      console.log('Demo user created:', currentUser);

      const today = new Date().toISOString().split("T")[0];
      journalDatePicker.value = today;

      loadUserData();
      createParticles();

      
      setTimeout(() => {
        console.log('Initializing habit tracker for demo user');
        initializeHabitTracker();
      }, 500);
    }, 100);
  }
});





const Db = getDatabase();
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChat = document.getElementById('send-chat');
const chatRoomSelector = document.getElementById('chat-room-selector');

let currentRoom = chatRoomSelector.value;
let loadedDates = new Set();
let oldestLoadedDate = new Date(); 
let allMessages = new Map(); 


function getFormattedDate(date) {
  return date.toISOString().split('T')[0];
}


function getDisplayDate(dateString) {
  const today = getFormattedDate(new Date());
  const yesterday = getFormattedDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';

  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}


function loadMessagesForDate(date) {
  return new Promise((resolve) => {
    const dateKey = getFormattedDate(date);

    if (loadedDates.has(dateKey)) {
      resolve();
      return;
    }

    loadedDates.add(dateKey);
    const chatRef = dbRef(Db, `peer-chat/${currentRoom}/${dateKey}`);

    
    get(chatRef).then((snapshot) => {
      const messages = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const msgData = childSnapshot.val();
          messages.push({
            ...msgData,
            id: childSnapshot.key,
            date: dateKey
          });
        });

        
        messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      }

      allMessages.set(dateKey, messages);
      resolve();
    }).catch((error) => {
      console.error('Error loading messages:', error);
      resolve();
    });
  });
}


function renderAllMessages() {
  chatWindow.innerHTML = '';

  
  const sortedDates = Array.from(loadedDates).sort();

  sortedDates.forEach(dateKey => {
    const messages = allMessages.get(dateKey) || [];

    if (messages.length > 0) {
      
      const dateLabel = document.createElement('div');
      dateLabel.textContent = getDisplayDate(dateKey);
      dateLabel.style.cssText = `
                text-align: center;
                margin: 15px 0 10px 0;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.7);
                font-weight: normal;
            `;
      chatWindow.appendChild(dateLabel);

      
      messages.forEach(msgData => {
        const msgContainer = document.createElement('div');
        msgContainer.style.cssText = `
                    margin: 6px 0;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    border-left: 3px solid ${msgData.color || '#00d4ff'};
                `;

        const messageText = document.createElement('div');
        messageText.innerHTML = `<span style="color: ${msgData.color || '#00d4ff'}; font-weight: 600;">${msgData.user || 'User'}</span>: ${msgData.message}`;
        messageText.style.cssText = `
                    color: #fff;
                    font-size: 14px;
                    line-height: 1.4;
                    word-wrap: break-word;
                    margin-bottom: 4px;
                `;

        const timestamp = document.createElement('div');
        timestamp.style.cssText = `
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: right;
                `;

        if (msgData.timestamp) {
          const time = new Date(msgData.timestamp);
          timestamp.textContent = time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        msgContainer.appendChild(messageText);
        msgContainer.appendChild(timestamp);
        chatWindow.appendChild(msgContainer);
      });
    }
  });
}


function loadTodayMessages() {
  const today = new Date();
  const todayKey = getFormattedDate(today);

  
  chatWindow.innerHTML = '';
  loadedDates.clear();
  allMessages.clear();
  oldestLoadedDate = new Date(today);

  
  loadMessagesForDate(today).then(() => {
    renderAllMessages();
    scrollToBottom();

    
    const todayRef = dbRef(Db, `peer-chat/${currentRoom}/${todayKey}`);

    console.log('Setting up listener for:', `peer-chat/${currentRoom}/${todayKey}`); 

    onChildAdded(todayRef, (snapshot) => {
      console.log('New message received:', snapshot.val()); 

      const msgData = snapshot.val();
      const newMessage = {
        ...msgData,
        id: snapshot.key,
        date: todayKey
      };

      
      const todayMessages = allMessages.get(todayKey) || [];

      
      const exists = todayMessages.some(msg => msg.id === newMessage.id);

      if (!exists) {
        console.log('Adding new message to chat'); 
        todayMessages.push(newMessage);
        
        todayMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        allMessages.set(todayKey, todayMessages);

        
        renderAllMessages();
        scrollToBottom();
      } else {
        console.log('Message already exists, skipping'); 
      }
    });
  });
}


async function loadPreviousDay() {
  const previousDay = new Date(oldestLoadedDate);
  previousDay.setDate(previousDay.getDate() - 1);

  const previousScrollHeight = chatWindow.scrollHeight;

  await loadMessagesForDate(previousDay);
  renderAllMessages();

  
  oldestLoadedDate = previousDay;

  
  chatWindow.scrollTop = chatWindow.scrollHeight - previousScrollHeight;
}


function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}


chatWindow.addEventListener('scroll', () => {
  if (chatWindow.scrollTop === 0) {
    loadPreviousDay();
  }
});


sendChat.addEventListener('click', () => {
  const message = chatInput.value.trim();
  console.log('Sending message:', message); 

  if (message) {
    const todayKey = getFormattedDate(new Date());
    const messageData = {
      message,
      timestamp: Date.now(),
      color: (typeof userColor !== 'undefined') ? userColor : '#00d4ff',
      user: (typeof userName !== 'undefined') ? userName : 'User'
    };

    console.log('Message data:', messageData); 
    console.log('Sending to room:', currentRoom, 'date:', todayKey); 

    push(dbRef(Db, `peer-chat/${currentRoom}/${todayKey}`), messageData)
      .then(() => {
        console.log('Message sent successfully'); 
      })
      .catch((error) => {
        console.error('Error sending message:', error); 
      });

    chatInput.value = '';
  }
});


chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendChat.click();
  }
});


chatRoomSelector.addEventListener('change', () => {
  currentRoom = chatRoomSelector.value;
  loadTodayMessages();
});


loadTodayMessages();




async function fetchAISuggestions(userId) {
  try {
    
    const today = new Date().toISOString().split('T')[0];
    const moodDoc = await getDoc(doc(db, "users", userId, "moods", today));

    if (!moodDoc.exists()) {
      document.getElementById('ai-suggestions').innerText = "No mood data available today.";
      return;
    }

    const userMood = moodDoc.data().mood;

    
    const response = await fetch(`/api/ai-suggestions/${userMood}`);
    const data = await response.json();

    document.getElementById('ai-suggestions').innerText = data.suggestion;

  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    document.getElementById('ai-suggestions').innerText = "Error loading suggestions.";
  }
}



function showCenteredNotification(message, type = 'warning') {
  
  const existing = document.querySelector('.centered-notification-backdrop');
  if (existing) existing.remove();

  const container = document.getElementById('centered-notification-container');

  const backdrop = document.createElement('div');
  backdrop.className = 'centered-notification-backdrop';

  const notification = document.createElement('div');
  notification.className = `centered-notification ${type}`;

  const closeButton = document.createElement('button');
  closeButton.className = 'close-btn';
  closeButton.textContent = '✖';
  closeButton.addEventListener('click', () => {
    backdrop.remove();
  });

  const icon = document.createElement('div');
  icon.style.fontSize = '2.5rem';
  icon.style.marginBottom = '1rem';

  if (type === 'success') icon.textContent = '🎉';
  else if (type === 'warning') icon.textContent = '⚡';
  else icon.textContent = 'ℹ️';

  const text = document.createElement('div');
  text.textContent = message;

  notification.appendChild(closeButton);
  notification.appendChild(icon);
  notification.appendChild(text);
  backdrop.appendChild(notification);
  container.appendChild(backdrop);

  
  setTimeout(() => {
    if (backdrop.parentNode) backdrop.remove();
  }, 5000);
}


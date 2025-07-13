import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const token = '8026751166:AAHlei_Ai77hZ3PYacfEuTKG4KQEyOkNvSI';
const bot = new TelegramBot(token, { polling: true });

const userState = new Map(); // userId → { stage: 'awaitingModules' | 'awaitingBreaks', mods, breaks }

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState.set(chatId, { stage: 'awaitingModules' });

  bot.sendMessage(chatId, `Hello there! Let me help you plan your timetable! First, tell me the modules you will be taking this semester.`);
});

bot.onText(/\/reset/, (msg) => {
    const chatId = msg.chat.id;
    userState.delete(chatId); // Clear stored state for this user
  
    bot.sendMessage(chatId, `Alright, I've reset our conversation. Let's start over! 🚀\n\nPlease tell me the modules you'll be taking this semester.`);
    
    // Reinitialize the state
    userState.set(chatId, { stage: 'awaitingModules' });
  });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userState.has(chatId)) return;

  const state = userState.get(chatId);

  if (state.stage === 'awaitingModules') {
    // Capture and clean module codes
    const mods = text.split(',').map(s => s.trim().toUpperCase());
    state.mods = mods;
    state.stage = 'awaitingBreaks';

    bot.sendMessage(chatId, `Great! Now tell me more about your schedule. Are there any timings you want to leave untouched?\nWrite each as: Day: Monday, Start: 12:00, End: 13:00.`);
  }

  else if (state.stage === 'awaitingBreaks') {
    const lines = text.match(/Day:.*?(?=Day:|$)/gs); // regex for multiple breaks
    const breaks = [];

    for (const line of lines || []) {
      const day = line.match(/Day:\s*(\w+)/i)?.[1];
      const start = line.match(/Start:\s*([0-9]{2}:[0-9]{2})/i)?.[1];
      const end = line.match(/End:\s*([0-9]{2}:[0-9]{2})/i)?.[1];

      if (day && start && end) {
        breaks.push({ day, startTime: start, endTime: end });
      }
    }

    state.breaks = breaks;

    const apiURL = 'http://localhost:3000/nusmodsURL';
    const queryParams = new URLSearchParams({
      mods: state.mods.join(','),
      sem: '1',
      acadYear: '2025-2026',
      breaksByDay: JSON.stringify(state.breaks)
    });

    try {
      const response = await axios.get(`${apiURL}?${queryParams}`);
      const finalLink = response.data?.url || response.data; // depends on server

      bot.sendMessage(chatId, `Here you go! Click [this link](${finalLink}) to view your customized timetable! For me to check: ${queryParams}`, {
        parse_mode: 'Markdown'
      });

      userState.delete(chatId);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, `Oops! Something went wrong. Please try again later.`);
    }
  }
});
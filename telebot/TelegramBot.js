import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const token = '8026751166:AAHlei_Ai77hZ3PYacfEuTKG4KQEyOkNvSI';
const bot = new TelegramBot(token, { polling: true });

const userState = new Map(); // userId → { stage, mods, breaks, currentBreak }

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState.set(chatId, { stage: 'awaitingModules', breaks: [] });

  bot.sendMessage(chatId, `Hello there! Let me help you plan your timetable! First, tell me the modules you will be taking this semester.`);
});

bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  userState.delete(chatId);

  bot.sendMessage(chatId, `Alright, I've reset our conversation. Let's start over! 🚀\n\nPlease tell me the modules you'll be taking this semester.`);
  userState.set(chatId, { stage: 'awaitingModules', breaks: [] });
});

bot.onText(/\/addBreak/, (msg) => {
  const chatId = msg.chat.id;
  const state = userState.get(chatId);
  if (!state) return;

  state.stage = 'addingBreak';

  bot.sendMessage(chatId, 'Choose a day for your break:', {
    reply_markup: {
      inline_keyboard: days.map(day => [{ text: day, callback_data: `breakDay:${day}` }])
    }
  });
});

bot.onText(/\/finaliseBreak/, (msg) => {
  const chatId = msg.chat.id;
  const state = userState.get(chatId);
  if (!state || !state.breaks.length) {
    bot.sendMessage(chatId, `Here's a summary of your breaks:\nNo breaks selected.\n\nType /generate to get your timetable link.`);
  }
  else {
    const summary = state.breaks.map(b => `• ${b.day} ${b.startTime} - ${b.endTime}`).join('\n');
    bot.sendMessage(chatId, `Here's a summary of your breaks:\n${summary}\n\nType /generate to get your timetable link.`);
  }
});

bot.onText(/\/generate/, async (msg) => {
  const chatId = msg.chat.id;
  const state = userState.get(chatId);
  if (!state || !state.mods?.length) return;

  const apiURL = 'http://34.67.168.200:3000/nusmodsURL';
  const queryParams = new URLSearchParams({
    mods: state.mods.join(','),
    sem: '1',
    acadYear: '2025-2026',
    breaksByDay: JSON.stringify(state.breaks)
  });

  try {
    const response = await axios.get(`${apiURL}?${queryParams}`);
    const finalLink = response.data?.output || response.data;

    bot.sendMessage(chatId, `Here you go! Click [this link](${finalLink}) to view your customized timetable!`, {
      parse_mode: 'Markdown'
    });

    userState.delete(chatId);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `Oops! Something went wrong. Please try again later.`);
  }
});

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const state = userState.get(chatId);
  if (!state) return;

  const [type, ...rest] = callbackQuery.data.split(':');
  const value = rest.join(':'); // Fix for values with colon


  if (type === 'breakDay') {
    state.currentBreak = { day: value };
    bot.sendMessage(chatId, `Now choose the *start time* for ${value}:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: times.map(t => [{ text: t, callback_data: `breakStart:${t}` }])
      }
    });
  }

  else if (type === 'breakStart') {
    state.currentBreak.startTime = value;
    bot.sendMessage(chatId, `Now choose the *end time* for ${state.currentBreak.day}:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: times.map(t => [{ text: t, callback_data: `breakEnd:${t}` }])
      }
    });
  }

  else if (type === 'breakEnd') {
    state.currentBreak.endTime = value;
    state.breaks.push(state.currentBreak);
    delete state.currentBreak;
    bot.sendMessage(chatId, `✅ Break added! You can type /addBreak to add another or /finaliseBreak to continue.`);
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith('/')) return;
  if (!userState.has(chatId)) return;

  const state = userState.get(chatId);

  // Only accept module input in the correct stage
  if (state.stage === 'awaitingModules') {
    const mods = text.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!mods.length) {
      bot.sendMessage(chatId, 'Please enter at least one module, separated by commas.');
      return;
    }
    state.mods = mods;

    const apiURL = 'http://34.67.168.200:3000/nusmodsURL';
    const queryParams = new URLSearchParams({
      mods: mods,
      sem: '1',
      acadYear: '2025-2026',
      breaksByDay: JSON.stringify(state.breaks)
    });

    try {
      const response = await axios.get(`${apiURL}?${queryParams}`);

      if (response.data?.output == "No Combination Works") {
        bot.sendMessage(chatId, `That combination has unavoidable clashes. Please try another one.\n\nEnter your modules as a comma-separated list (e.g., CS1010, MA1101R).`);
        return;
      } else {
        state.stage = 'idle';
        bot.sendMessage(chatId, `Great! Now add breaks you want by typing /addBreak. Once done, press /finaliseBreak`);
      }
    } catch (err) {
      bot.sendMessage(chatId, `There was an error checking your modules. Please try again.`);
      return;
    }
  }
});

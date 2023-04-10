import {Schema, model} from 'mongoose';

const store = new Map();
const userSchema = new Schema({
  discordId: String,
  refreshToken: String,
  gameId: {
    en: Number,
    jp: Number,
  },
});

export const User = model('User', userSchema)

// TODO: store/get tokens from mongodb instead
export async function storeDiscordTokens(userId, tokens) {
  await store.set(`discord-${userId}`, tokens);
}

export async function getDiscordTokens(userId) {
  return store.get(`discord-${userId}`);
}

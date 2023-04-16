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

export async function storeRefreshToken(userId, token) {
  let user = new User({
    discordId: userId,
    refreshToken: token,
  });

  await user.save();
}

export async function getRefreshToken(userId) {
  let user = await User.findOne({discordId: userId});
  if (!user) {
    return null
  }
  return user.refreshToken;
}
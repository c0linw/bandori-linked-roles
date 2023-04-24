const {Schema, model, connect} = require('mongoose');

const userSchema = new Schema({
  discordId: String,
  refreshToken: String,
  gameId: {
    en: Number,
    jp: Number,
  },
});

const User = model('User', userSchema)

connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,

})
    .then(() => console.log('MongoDB database Connected...'))
    .catch((err) => console.log(err))

async function storeRefreshToken(userId, token) {
  let user = new User({
    discordId: userId,
    refreshToken: token,
  });

  await user.save();
}

async function getRefreshToken(userId) {
  let user = await User.findOne({discordId: userId});
  if (!user) {
    return null
  }
  return user.refreshToken;
}

module.exports = {
  User,
  storeRefreshToken,
  getRefreshToken
}
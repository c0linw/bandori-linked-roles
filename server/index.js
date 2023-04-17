const cookieParser = require("cookie-parser");
const config = require('./config.js').config;
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const router = require('./api.js').router;
const session = require('express-session');
const passport  = require("passport");
const refresh = require("passport-oauth2-refresh");
const DiscordStrategy = require("passport-discord").Strategy;
const storage = require("./storage.js");

const app = express()

app.use(cors());
app.use(session({
    secret: config.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser(config.COOKIE_SECRET));
app.use(bodyParser.json());

const discordStrat = new DiscordStrategy({
        clientID: config.DISCORD_CLIENT_ID,
        clientSecret: config.DISCORD_CLIENT_SECRET,
        callbackURL: config.DISCORD_REDIRECT_URI,
        scope: ['identify']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user is already in the database
            let user = await storage.User.findOne({discordId: profile.id});

            if (!user) {
                // Create a new user if they're not in the database
                user = new storage.User({
                    discordId: profile.id,
                    refreshToken: refreshToken,
                    gameId: {
                        en: null,
                        jp: null
                    }
                });

                await user.save();
                //await updateMetadata(user.discordId);
            } else {
                // Update the user's access token if they're already in the database
                user.refreshToken = refreshToken;

                // If the user hasn't set their game ID yet, set it to null
                if (!user.gameId) {
                    user.gameId = {
                        en: null,
                        jp: null
                    };
                }

                await user.save();
                //await updateMetadata(user.discordId);
            }

            done(null, user);
        } catch (error) {
            done(error);
        }
    });

passport.use(discordStrat);
refresh.use(discordStrat);

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,

    })
    .then(() => console.log('MongoDB database Connected...'))
    .catch((err) => console.log(err))

app.use('/', router)

app.listen(process.env.PORT, () => {
    console.log(`App is listening at port ${process.env.PORT}`)
})
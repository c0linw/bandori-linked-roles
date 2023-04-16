import * as discord from './discord.js';
import * as storage from './storage.js';

import config from './config.js';
import Router from 'express'
import passport from "passport";
import DiscordStrategy from "passport-discord";
import refresh from "passport-oauth2-refresh";
const { createSSRApp } = require("vue");
const { renderToString } = require("@vue/server-renderer");
const Profile = require("./views/profile.vue").default;

const router = Router()

router.get('/', (req, res) => {
    res.send('Hello World')
})

router.get('/authtest', (req, res) => {
    if (req.isAuthenticated()) {
        res.send('You are authenticated')
    } else {
        res.send('You are not authenticated')
    }
})

router.get('/failed', (req, res) => {
    res.send('auth failed')
})

router.get("/profile", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const app = createSSRApp(Profile, { user: req.user });
            const html = await renderToString(app);

            res.send(html);
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.redirect("/login");
    }
});

router.get('/profile/update', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`
      <form action="/profile/update" method="post">
        <label for="gameId">Enter your game ID:</label>
        <input type="text" id="gameId" name="gameId">
        <button type="submit">Submit</button>
      </form>
    `);
    } else {
        res.redirect('/login');
    }
});

router.post('/profile/update', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            // Find the current user
            const user = await storage.User.findOne({discordId: req.user.id});

            // Update the user's game ID
            user.gameId.en = req.body.gameId;

            await user.save();

            res.redirect('/profile');
        } catch (error) {
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/login');
    }
});

/**
 * Route configured in the Discord developer console which facilitates the
 * connection between Discord and any additional services you may use.
 * To start the flow, generate the OAuth2 consent dialog url for Discord,
 * and redirect the user there.
 */
router.get('/login', async (req, res) => {
    const {url, state} = discord.getOAuthUrl();

    // Store the signed state param in the user's cookies so we can verify
    // the value later. See:
    // https://discord.com/developers/docs/topics/oauth2#state-and-security
    res.cookie('clientState', state, {maxAge: 1000 * 60 * 5, signed: true});

    // Send the user to the Discord owned OAuth2 authorization endpoint
    res.redirect(url);
});

/**
 * Route configured in the Discord developer console, the redirect Url to which
 * the user is sent after approving the bot for their Discord account. This
 * completes a few steps:
 * 1. Uses the code to acquire Discord OAuth2 tokens
 * 2. Uses the Discord Access Token to fetch the user profile
 * 3. Stores the OAuth2 Discord Tokens in Redis / Firestore
 * 4. Lets the user know it's all good and to go back to Discord
 */
router.get('/discord-oauth-callback', passport.authenticate('discord', {
    failureRedirect: '/failed'
}), function (req, res) {
    res.redirect('/profile')
});

/**
 * Example route that would be invoked when an external data source changes.
 * This example calls a common `updateMetadata` method that pushes static
 * data to Discord.
 */
router.post('/update-metadata', async (req, res) => {
    try {
        const userId = req.body.userId;
        await updateMetadata(userId)

        res.sendStatus(204);
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * Given a Discord UserId, push data to the Discord
 * metadata endpoint.
 */
async function updateMetadata(userId) {
    let metadata = {};
    try {
        // 1. get user's game ID
        // 2. query bestdori
        // 3. extract data
        metadata = {
            cookieseaten: 1483,
            allergictonuts: 0, // 0 for false, 1 for true
            firstcookiebaked: '2003-12-20',
        };
    } catch (e) {
        e.message = `Error fetching external data: ${e.message}`;
        console.error(e);
        // If fetching the profile data for the external service fails for any reason,
        // ensure metadata on the Discord side is nulled out. This prevents cases
        // where the user revokes an external app permissions, and is left with
        // stale linked role data.
    }

    // Push the data to Discord.
    await discord.pushMetadata(userId, metadata);
}

export default router;
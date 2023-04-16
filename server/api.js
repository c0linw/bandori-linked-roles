import * as discord from './discord.js';
import * as storage from './storage.js';

import config from './config.js';
import Router from 'express'
import passport from "passport";
import DiscordStrategy from "passport-discord";
import refresh from "passport-oauth2-refresh";

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

// TODO: replace with non-placeholder redirects
router.get('/success', (req, res) => {
    res.send('auth success')
})
router.get('/failed', (req, res) => {
    res.send('auth failed')
})

/**
 * Route configured in the Discord developer console which facilitates the
 * connection between Discord and any additional services you may use.
 * To start the flow, generate the OAuth2 consent dialog url for Discord,
 * and redirect the user there.
 */
router.get('/linked-role', async (req, res) => {
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
    res.redirect('/success')
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
 * Given a Discord UserId, push static make-believe data to the Discord
 * metadata endpoint.
 */
async function updateMetadata(userId) {
    // Fetch the Discord tokens from storage
    const tokens = await storage.getDiscordTokens(userId);

    let metadata = {};
    try {
        // Fetch the new metadata you want to use from an external source.
        // This data could be POST-ed to this endpoint, but every service
        // is going to be different.  To keep the example simple, we'll
        // just generate some random data.
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
    await discord.pushMetadata(userId, tokens, metadata);
}

export default router;
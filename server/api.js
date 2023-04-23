const discord = require('./discord.js');
const storage = require('./storage.js');

const Router = require('express');
const passport = require('passport');
const fetch = require('node-fetch');

const router = Router()

router.get('/', (req, res) => {
    res.send('Hello World')
})

router.get('/authtest', (req, res) => {
    if (req.isAuthenticated()) {
        res.send('You are authenticated')
    } else {
        res.status(401).send('You are not authenticated')
    }
})

router.get('/failed', (req, res) => {
    res.send('auth failed')
})

router.get('/accounts', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const user = await storage.User.findOne({discordId: req.user.discordId});
            if (user) {
                res.send(user.gameId);
            } else {
                res.status(400).send("User not found");
            }
        } catch (e) {
            console.error(e);
            res.status(500).send("Internal server error");
        }
    } else {
        res.status(401).send('Please authenticate Discord account');
    }
})

router.post('/profile/update', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            // Find the current user
            const user = await storage.User.findOne({discordId: req.user.discordId});

            // Update the user's game ID
            if (req.body.en && req.body.en !== "") {
                user.gameId.en = req.body.en;
            }
            if (req.body.jp && req.body.en !== "") {
                user.gameId.jp = req.body.jp;
            }

            await user.save();
            await updateMetadata(user.discordId)

            res.send("success");
        } catch (error) {
            console.log(error.message)
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(401).send('Please authenticate Discord account');
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
    res.redirect(process.env.FRONTEND_URL)
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
        let user = await storage.User.findOne({discordId: userId})
        // 2. query bestdori
        let url = `https://bestdori.com/api/player/en/${user.gameId.en}?mode=2`
        let response = await fetch(url, {method: 'GET'})
        // 3. extract data
        if (response.ok) {
            const data = await response.json();
            // TODO: handle bestdori data in a more robust way
            let expert_fcs = parseInt(data.data.profile.fullComboMusicCountMap.entries.expert, 10)
            let special_fcs = parseInt(data.data.profile.fullComboMusicCountMap.entries.special, 10);
            metadata = {
                player_rank: data.data.profile.rank,
                fc_count: expert_fcs + special_fcs,
                id: data.data.profile.userId,
            };
            // Push the data to Discord.
            await discord.pushMetadata(userId, metadata);
        } else {
            throw new Error(`Error getting Bestdori user data: [${response.status}] ${response.statusText}`);
        }
    } catch (e) {
        e.message = `Error fetching external data: ${e.message}`;
        console.error(e);
        // If fetching the profile data for the external service fails for any reason,
        // ensure metadata on the Discord side is nulled out. This prevents cases
        // where the user revokes an external app permissions, and is left with
        // stale linked role data.
    }
}

module.exports = {
    router
}
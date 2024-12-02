import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_API_BASE_URL = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.BOT_TOKEN;

app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.send('Discord Proxy Server is Running!');
});

// Proxy route: Fetch messages
app.get('/messages/:channelId/:userId', async (req, res) => {
    const { channelId, userId } = req.params;

    try {
        let messageCount = 0;
        let before = null;

        while (true) {
            const url = `${DISCORD_API_BASE_URL}/channels/${channelId}/messages?limit=100${before ? `&before=${before}` : ''}`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`,
                },
            });

            if (!response.ok) {
                return res.status(response.status).json({ error: response.statusText });
            }

            const messages = await response.json();
            if (messages.length === 0) break;

            messageCount += messages.filter(msg => msg.author.id === userId).length;
            if (messages.length < 100) break;

            before = messages[messages.length - 1].id;
        }

        res.json({ messageCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Proxy route: Fetch roles
app.get('/roles/:guildId/:userId', async (req, res) => {
    const { guildId, userId } = req.params;

    try {
        const url = `${DISCORD_API_BASE_URL}/guilds/${guildId}/members/${userId}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: response.statusText });
        }

        const member = await response.json();
        res.json({ roles: member.roles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

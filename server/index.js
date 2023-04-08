import cookieParser from "cookie-parser";

import config from './config.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from  'mongoose';
import router from './api.js';

const app = express()

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser(config.COOKIE_SECRET));

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
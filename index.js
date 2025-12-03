/**
 * Created by yubh on 2018/2/5.
 */
const express = require("express");
const consign = require("consign");
const app = express();

/// 在使用include或者then的时候，是有顺序的，如果传入的参数是一个文件夹
/// 那么他会按照文件夹中文件的顺序进行加载
consign({ verbose: false })
    .include('config.js')
    .then('db.js')
    .then("auth.js")
    .then('middlewares.js')
    .then('routers')
    .then('boot.js')
    .into(app);

// Initialize AI Crawler Service
try {
    const aiCrawler = require('./services/ai_crawler')(app);
    console.log('AI Crawler Service initialized');
} catch (error) {
    console.error('Failed to initialize AI Crawler Service:', error);
}

module.exports = app;

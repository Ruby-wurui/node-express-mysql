/**
 * Created by yubh on 2018/2/5.
 */
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const debug = require('debug')('express:server');
const session = require('express-session');
const morgan = require('morgan');
const logger = require("./logger");
const cors = require("cors");
const compression = require('compression');
const helmet = require('helmet');
const connectHistoryApiFallback = require('connect-history-api-fallback');
const jwt = require('jsonwebtoken');

const MongoStore = require('connect-mongo')(session);

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'asdfsafsafsafsafsafsafsafd');

        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

// Regular user authentication middleware
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'asdfsafsafsafsafsafsafsafd');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

module.exports = (app) => {

    // 首先设置CORS，必须在其他中间件之前
    app.use(cors({
        origin: true, // 允许所有域名访问
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }));

    /*
    设置/public/favicon.ico为favicon图标
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    */

    //加载日志中间件打印网络请求日志方法
    app.use(morgan('dev'));
    //打印日志方法二
    app.use(morgan("common", {
        stream: {
            write: (message) => {
                logger.info(message);
            }
        }
    }));

    //对数据进行了gzip压缩
    app.use(compression());
    //帮助设置 http header
    app.use(helmet());
    //加载解析json的中间件
    app.use(bodyParser.json({ limit: '50mb' }));
    //初始化授权方法
    app.use(app.auth.initialize());
    //加载解析urlencoded请求体的中间件
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
    //加载解析cookie的中间件
    app.use(cookieParser(app.config.cookieSecret));
    // 由js控制路由后端不做页面路由配置，一定要写在express.static前面！！！
    // 配置history fallback，但排除API路由
    app.use('/', connectHistoryApiFallback({
        rewrites: [
            // 排除API路由，让它们正常处理
            {
                from: /^\/api\/.*$/, to: function (context) {
                    return context.parsedUrl.pathname;
                }
            }
        ]
    }));
    //设置dist文件夹为存放静态文件的目录
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use(session({
        secret: app.config.cookieSecret,//作为服务器端生成session的签名 用来对session id相关的cookie进行签名
        key: app.config.db,//cookie name
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },//cookie 报错最大期限为 30 days
        resave: false,
        saveUninitialized: false
        /*store: new MongoStore({  //向数据库存储 sesstion 信息
            db: settings.db,
            host: settings.host,
            port: settings.port,
            url: 'mongodb://localhost/blog'
        })*/
    }));



};


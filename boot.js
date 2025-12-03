/**
 * Created by yubh on 2018/2/5.
 */
//const fs = require("fs");
//const https = require("https");
const http = require('http');
const path = require('path');
const ejs = require('ejs');
const { Server } = require('socket.io');
const socketHandlers = require('./socket/socketHandlers');


module.exports = (app) => {
    "use strict";
    //设置 dist 文件夹为存放视图文件的目录, 即存放模板文件的地方,__dirname 为全局变量,存储当前正在执行的脚本所在的目录
    app.set('views', path.join(__dirname, 'dist'));
    //设置返回原始 html 页面
    app.set('view engine', 'html');
    app.engine('html', ejs.renderFile);

    //设置端口号
    var port = normalizePort(app.config.port);
    app.set('port', port);

    app.db.sequelize.sync().then(() => {//同步所有已定义的模型到数据库中成功后的回调
        let server = http.createServer(app);

        // Initialize Socket.IO
        const io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        // Setup socket handlers
        socketHandlers(io);

        // Make io available to the app
        app.io = io;

        server.listen(app.get("port"), () => {
            const address = server.address();
            //   console.log("address:::::",app.config);
            console.log(`Socket.IO server initialized and ready for connections`);
            console.log(`SERVER LISTENING TO>>>>>>>>>>>(SERVER START)>>>>>>>>>>>>>>> PORT:http://${app.config.host}:${app.get('port')}`);
        });
    }).catch(err => {
        console.error('数据库同步失败:', err.message);
    });


};


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    //console.log('port::::',port);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}



/*
 https请求设置
 const credentials = {
 key: fs.readFileSync("44885970_www.localhost.com.key", "utf8"),
 cert: fs.readFileSync("44885970_www.localhost.com.cert", "utf8")
 };
 https.createServer(credentials,app).listen(app.get("port"), () => {
 console.log('SERVER LISTENING TO PORT:'+ app.get('port')+' yubh: >>>>>>>>>>>>>>>>(SERVER START)>>>>>>>>>>>>>>>>>>>>>');
 });
 */
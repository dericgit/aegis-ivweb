'use strict';

const express = require('express');
const router = express.Router();

module.exports = router;

router.get('/update_session', function (req, res) {
    const userDao = req.models.userDao;
    const loginName = req.session.user.loginName;

    if (!loginName) return res.json({
        code: -1, message: '请登录'
    });

    userDao.one({ loginName }, (err, user) => {
        if (!user) return res.json({
            code: 1100,
            error: 'LOGIN_ERR',
            message: '登陆失败，请检查账号'
        });

        if (user.verify_state ===2) {
            req.session.user = {
                role: user.role,
                id: user.id,
                email: user.email,
                loginName: user.loginName,
                chineseName: user.chineseName,
                verify_state: parseInt(user.verify_state, 10),
                openid: user.openid
            };

            meAction(req, res);
        } else {
            res.redirect(`https://aegis.ivweb.io`);
        }
    });
});

/**
 * 绑定并注册
 */
router.post('/bind-openid', function (req, res) {
    const userDao = req.models.userDao;
    const loginName = (req.body.loginName || '').trim();
    const openid = (req.body.openid || '').trim();

    // 有人曾经不断注入无效的用户名
    if (!/^[A-Za-z_]{3,20}$/.test(loginName)) {
        return res.json({
            code: 1005,
            error: 'INVALID_LOGINNAME',
            message: '大佬别玩了'
        });
    }

    if (!loginName || !openid || loginName.length > 20) {
        return res.json({
            code: 1005,
            error: 'INVALID_LOGINNAME',
            message: '参数错误'
        });
    }

    userDao.one({ loginName }, (err, user) => {
        if (err) {
            res.json({
                code: 1002,
                error: 'QUERY_USER_SQL_ERR',
                message: '系统错误，请联系管理员'
            });
        } else if (user) {
            if (user.openid) {
                return res.json({
                    code: 1006,
                    error: 'OPENID_OCCUPY',
                    message: '该 RTX 已被绑定，如有疑问请联系管理员'
                });
            }

            // 用户已存在，绑定之
            user.openid = openid;
            user.verify_state = 1;
            user.save(err => {
                if (err) {
                    res.json({ code: 1002, error: 'QUERY_USER_SQL_ERR' });
                } else {
                    req.session.user = {
                        role: user.role,
                        id: user.id,
                        email: user.email,
                        loginName: user.loginName,
                        chineseName: user.chineseName,
                        verify_state: parseInt(user.verify_state, 10),
                        openid: user.openid
                    };
                    meAction(req, res);
                }
            });
        } else {
            userDao.create({
                chineseName: loginName,
                role: 0,
                // 下面这 3 个参数很重要
                loginName,
                openid,
                verify_state: 1
            }, (err, user) => {
                if (err) {
                    console.error(err);
                    res.json({
                        code: 1004,
                        error: 'INSERT_USER_SQL_ERR',
                        message: '系统错误，请联系管理员' + err
                    });
                } else {
                    req.session.user = {
                        role: user.role,
                        id: user.id,
                        email: user.email,
                        loginName: user.loginName,
                        chineseName: user.chineseName,
                        verify_state: parseInt(user.verify_state, 10),
                        openid: user.openid
                    };
                    meAction(req, res);
                }
            });
        }
    });
});


/**
 * 获取个人资料
 */
function meAction (req, res) {
    if (!req.session.user) {
        res.json({
            code: -1,
            message: '请登录',
            data: null
        });
    } else {
        res.json({
            code: 0,
            data: {
                loginName: req.session.user.loginName,
                role: req.session.user.role,
                email: req.session.user.email,
                avatar: req.session.user.avatar,
                chineseName: req.session.user.chineseName,
                verify_state: parseInt(req.session.user.verify_state, 10)
            }
        });
    }
}

router.get('/me', meAction);


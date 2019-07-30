'use strict';

const express = require('express');
const router = express.Router();
const models  = require('./model');
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;

router.get('/:id/:type', (req, res) => {
    const id = req.params.id;
    const type = req.params.type;
    let model;
    switch(type) {
        case 'img': {
            model = models.Img;
            break;
        }
        case 'script': {
            model = models.Script;
            break;
        }
        case 'fetch': {
            model = models.Fetch;
            break;
        }
        default: {
            res.json(403, {
                ret: 2000,
                error: 'PARAM_ERROR',
                message: '传参无效'
            });
        }
    }
    const { startDate, endDate, url } = req.query;
    if (!id) {
        res.json(403, {
            ret: 2000,
            error: 'INVALID_VERIFY_STATE',
            message: '传参无效'
        });
        return;
    }
    model.findAll({
        where: {
            aegis_id: id,
            url: decodeURIComponent(url),
            create_time: {
                [Op.between]: [new Date(parseInt(startDate)), new Date(parseInt(endDate))],
            }
        },
    }).then(data => {
        res.json({
            ret: 0,
            data: data
        })
    })

});

router.get('/:id/:type/url',  (req, res) => {
    const id = req.params.id;
    const type = req.params.type;
    let model;
    switch(type) {
        case 'img': {
            model = models.Img;
            break;
        }
        case 'script': {
            model = models.Script;
            break;
        }
        case 'fetch': {
            model = models.Fetch;
            break;
        }
        default: {
            res.json(403, {
                ret: 2000,
                error: 'PARAM_ERROR',
                message: '传参无效'
            });
        }
    }
    if (!id) {
        res.json(403, {
            ret: 2000,
            error: 'INVALID_VERIFY_STATE',
            message: '传参无效'
        })
    }
    model.findAll({
        where: {
            aegis_id: id
        },
        attributes: [Sequelize.fn('DISTINCT', Sequelize.col('url')), 'url'],
    }).then(urls => {
        res.json({
            ret: 0,
            data: urls
        });
    })
});

module.exports = router;
'use strict';

const express = require('express');
const router = express.Router();
const models  = require('./model');
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;

router.get('/:id/img', (req, res) => {
    const id = req.params.id;
    const { skip, limit, startDate, endDate, url } = req.query;
    if (!id) {
        res.json(403, {
            ret: 2000,
            error: 'INVALID_VERIFY_STATE',
            message: '传参无效'
        });
    }
    models.Img.findAll({
        where: {
            aegis_id: id,
            url: decodeURIComponent(url),
            create_time: {
                [Op.between]: [new Date(parseInt(startDate)), new Date(parseInt(endDate))],
            }
        },
        offset: skip || 0,
        limit: limit || 10
    }).then(images => {
        res.json({
            ret: 0,
            data: images
        })
    })

});

router.get('/:id/img/url',  (req, res) => {
    const id = req.params.id;
    const { skip, limit } = req.query;
    if (!id) {
        res.json(403, {
            ret: 2000,
            error: 'INVALID_VERIFY_STATE',
            message: '传参无效'
        })
    }
    models.Img.findAll({
        where: {
            aegis_id: id
        },
        offset: skip || 0,
        limit: limit || 10,
        attributes: [Sequelize.fn('DISTINCT', Sequelize.col('url')), 'url'],
    }).then(urls => {
        res.json({
            ret: 0,
            data: urls
        });
    })

});

module.exports = router;
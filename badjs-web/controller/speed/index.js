'use strict';

const express = require('express');
const router = express.Router();
const models = require('./model');
const moment = require('moment');
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;

router.get('/:id/static-daily', (req, res) => {
    const { id } = req.params;
    const { date } = req.query;
    if (!id || !date) {
        res.json(403, {
            ret: 2000,
            error: 'INVALID_VERIFY_STATE',
            message: '传参无效'
        })
    }
    const lastDay = moment(date).add(1, 'days');
    const thisDay = moment(date).add(2, 'days');
    models.StaticDaily.findOne({
        where: {
            aegis_id: id,
            create_time: {
                [Op.between]: [lastDay.toDate(), thisDay.toDate()]
            }
        }
    }).then(data => {
        let citySpeed = {}, cityStatus = {}, cityDistribution = {};
        if (data) {
            citySpeed = JSON.parse(data.city_speed);
            cityStatus = JSON.parse(data.city_status);
            cityDistribution = JSON.parse(data.city_distribution);
        }
        res.json({
            ret: 0,
            citySpeed,
            cityStatus,
            cityDistribution
        });
    })
});


router.get('/:id/fetch-daily', (req, res) => {
    const { id } = req.params;
    const { date } = req.query;
    if (!id || !date) {
        res.json(403, {
            ret: 2000,
            error: 'INVALID_VERIFY_STATE',
            message: '传参无效'
        })
    }
    const lastDay = moment(date).add(1, 'days');
    const thisDay = moment(date).add(2, 'days');
    models.FetchDaily.findOne({
        where: {
            aegis_id: id,
            create_time: {
                [Op.between]: [lastDay.toDate(), thisDay.toDate()]
            }
        }
    }).then(data => {
        let speed, status, distribution;
        if (data) {
            speed = data.speed;
            status = JSON.parse(data.status);
            distribution = JSON.parse(data.distribution);
        }
        res.json({
            ret: 0,
            speed,
            status,
            distribution
        });
    })
});


router.get('/:id/fetch-top', (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, limit } = req.query;
    if (!id) {
        res.json(403, {
            ret: 2000,
            error: 'INVALID_VERIFY_STATE',
            message: '传参无效'
        })
    }

    models.Fetch.findAll({
        where: {
            aegis_id: id,
            create_time: {
                [Op.between]: [new Date(parseInt(startDate)), new Date(parseInt(endDate))],
            },
        },
        attributes: [[Sequelize.fn('AVG', Sequelize.col('avg_time')), 'avg'], [Sequelize.fn('SUM', Sequelize.col('times')), 'times'], 'url'],
        group: 'url',
        limit: parseInt(limit) || 10,
        order: Sequelize.literal('avg DESC')
    }).then(data => {
        res.json({
            ret: 0,
            data
        });
    })
});

router.get('/:id/cgi-specific', (req, res) => {
    const id = req.params.id;
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
            create_time: {
                [Op.between]: [new Date(parseInt(startDate)), new Date(parseInt(endDate))],
            },
            url: decodeURIComponent(url)
        },
        attributes: ['status', 'distribution']
    }).then(data => {
        res.json({
            ret: 0,
            data: data,
            url
        })
    })

});

router.get('/:id/:type', (req, res) => {
    const id = req.params.id;
    const type = req.params.type;
    let model, attributes;
    switch (type) {
        case 'static': {
            model = models.Static;
            attributes = ['avg_time', 'create_time', 'times']
            break;
        }
        case 'fetch': {
            model = models.Fetch;
            attributes = ['avg_time', 'create_time', 'times']
            break;
        }
        case 'performance': {
            model = models.Performance;
            attributes = ['content_download', 'create_time', 'dns_lookup', 'dom_parse', 'id', 'resource_download', 'ssl', 'tcp', 'times', 'ttfb']
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
    const whereOptions = {
        aegis_id: id,
        create_time: {
            [Op.between]: [new Date(parseInt(startDate)), new Date(parseInt(endDate))],
        }
    };
    if (url) {
        whereOptions.url = decodeURIComponent(url);
    }
    model.findAll({
        where: whereOptions,
        attributes
    }).then(data => {
        res.json({
            ret: 0,
            data: data,
            url
        })
    })

});

router.get('/:id/:type/url', (req, res) => {
    const id = req.params.id;
    const type = req.params.type;
    let model;
    switch (type) {
        case 'static': {
            model = models.Static;
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
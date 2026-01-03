const express = require('express');
const router = express.Router();

router.get('/:id', (req, res, next) => {
    res.json({
        query: req.query,
        headers: req.headers,
        body: req.body,
        params: req.params

    })
})

module.exports = router;
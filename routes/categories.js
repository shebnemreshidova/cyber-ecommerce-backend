var express = require('express');
const Categories = require('../db/models/Categories');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
var router = express.Router();

router.get('/', async function (req, res) {
    try {
        const categories = await Categories.find({ is_active: true });
        res.json(Response.successResponse(categories));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(Response.errorResponse(error));
    }

});
router.post('/add', async function (req, res) {
    try {
        if (!req.body.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "name field must be filled");

        let category = new Categories({
            name: req.body.name,
            is_active: true,
            createdBy: req.body.user?._id
        });
        await category.save();
        res.json(Response.successResponse({ success: true }));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});
router.post('/update', async function (req, res) {
    try {
        const updates = {};

        if (!req.body._id)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id is required");

        if (req.body.name) updates.name = req.body.name;
        if (typeof req.body.is_active === 'boolean') updates.is_active = req.body.is_active;

        await Categories.updateOne({ _id: req.body._id }, updates);
        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});
router.delete('/delete', async function (req, res) {
    try {
        if (!req.body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id field must be filled");


        await Categories.deleteOne({ _id: req.body._id });
        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});



module.exports = router;

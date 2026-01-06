const express = require('express');
const router = express.Router();

const Roles = require('../db/models/Roles');
const RolePrivileges = require('../db/models/RolePrivileges');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const role_privileges = require('../config/role_privileges');

router.get('/', async function (req, res) {
    try {
        const roles = await Roles.find({});
        res.json(Response.successResponse(roles));
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', async function (req, res) {
    try {
        if (!req.body.role_name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "role_name field must be filled");
        if (!req.body.permissions || !Array.isArray(req.body.permissions) || req.body.permissions.length === 0) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "permissions field must be an array");
        }
        let role = new Roles({
            role_name: req.body.role_name,
            is_active: true,
            createdBy: req.body.user?._id
        });
        await role.save();

        for (let i = 0; i < req.body.permissions.length; i++) {
            let rolePrivilege = new RolePrivileges({
                role_id: role._id,
                permission: req.body.permissions[i]
            });
            await rolePrivilege.save();
        }

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

        if (req.body.role_name) updates.role_name = req.body.role_name;
        if (typeof req.body.is_active === 'boolean') updates.is_active = req.body.is_active;

        if (req.body.permissions && Array.isArray(req.body.permissions) && req.body.permissions.length > 0) {
            let permissions = await RolePrivileges.find({ role_id: req.body._id });
            let removedPermissions = permissions.filter(p => !req.body.permissions.includes(p.permission));
            let newPermissions = req.body.permissions.filter(p => !permissions.map(per => per.permission).includes(p));

            if (removedPermissions.length > 0) {
                await RolePrivileges.deleteOne({
                    _id: { $in: removedPermissions.map(p => p._id) }
                })
            }
            if (newPermissions.length > 0) {
                for (let i = 0; i < newPermissions.length; i++) {
                    let rolePrivilege = new RolePrivileges({
                        role_id: req.body._id,
                        permission: newPermissions[i]
                    });
                    await rolePrivilege.save();
                }   
            }
        }
        await Roles.updateOne({ _id: req.body._id }, updates);
        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});
router.delete('/delete', async function (req, res) {
    try {
        if (!req.body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id field must be filled");


        await Roles.deleteOne({ _id: req.body._id });
        await RolePrivileges.deleteMany({ role_id: req.body._id });
        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.get("/role_privileges", async (req, res) => {
    res.json(role_privileges);
})


module.exports = router;
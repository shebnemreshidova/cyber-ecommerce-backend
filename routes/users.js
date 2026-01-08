var express = require('express');
const Users = require('../db/models/Users');
var router = express.Router();
const Response = require('../lib/Response');
const Enum = require('../config/Enum');
const bcrypt = require('bcrypt-nodejs');
const CustomError = require('../lib/Error');
const is = require('is_js');
const UserRoles = require('../db/models/UserRoles');
const Roles = require('../db/models/Roles');

router.get('/', async function (req, res) {
  try {
    const users = await Users.find({});
    res.json(Response.successResponse(users));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }

});


router.post('/add', async function (req, res) {
  try {
    if (!req.body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "email field must be filled");
    if (is.not.email(req.body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "email field must be valid email");
    if (!req.body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "password field must be filled");
    if (Enum.PASS_LENGTH > req.body.password.length) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", `password length must be at least ${Enum.PASS_LENGTH} characters`);
    if (!req.body.roles || !Array.isArray(req.body.roles) || req.body.roles.length === 0) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "roles field must be filled");

    let roles = await Roles.find({ _id: { $in: req.body.roles } });
    if (roles.length === 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "Roles field must be an array");
    }

    const password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null);

    const user = new Users(
      {
        email: req.body.email,
        password,
        is_active: true,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone_number: req.body.phone_number
      }
    )
    user.save();

    for (let i = 0; i < roles.length; i++) {
      let userRole = new UserRoles({
        user_id: user._id,
        role_id: roles[i]._id
      });
      await userRole.save();
    }
    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})

router.post('/update', async function (req, res) {
  try {
    const updates = {};

    if (!req.body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id is required");
    if (req.body.password && Enum.PASS_LENGTH > req.body.password.length) {
      updates.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null);
    }
    if (req.body.first_name) updates.first_name = req.body.first_name;
    if (req.body.last_name) updates.last_name = req.body.last_name;
    if (req.body.phone_number) updates.phone_number = req.body.phone_number;
    if (typeof req.body.is_active === 'boolean') updates.is_active = req.body.is_active;

    if (Array.isArray(req.body.roles) || req.body.roles.length > 0) {

      let userRoles = await UserRoles.find({ user_id: req.body._id });

      let removedRoles = userRoles.filter(x => !req.body.roles.includes(x.role_id));
      let newRoles = req.body.roles.filter(x => !userRoles.map(r => r.role_id).includes(x));

      if (removedRoles.length > 0) {
        await UserRoles.deleteMany({ _id: { $in: removedRoles.map(x => x._id.toString()) } });
      }
      if (newRoles.length > 0) {
        for (let i = 0; i < newRoles.length; i++) {
          let userRole = new UserRoles({
            role_id: newRoles[i],
            user_id: req.body._id
          });

          await userRole.save();
        }
      }
    }

    await Users.updateOne({ _id: req.body._id }, updates);
    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})

router.delete("/delete", async function (req, res) {
  try {
    if (!req.body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id is required");
    await Users.deleteOne({ _id: req.body._id });
    await UserRoles.deleteMany({ user_id: req.body._id });
    res.json(Response.successResponse({ success: true }));

  } catch (err) {
    console.log(err, "error in deleting user");
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post('/register', async function (req, res) {
  try {
    let user = await Users.findOne({});
    if (user) {
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);
    }


    if (!req.body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "email field must be filled");
    if (is.not.email(req.body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "email field must be valid email");
    if (!req.body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "password field must be filled");
    if (Enum.PASS_LENGTH > req.body.password.length) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", `password length must be at least ${Enum.PASS_LENGTH} characters`);

    if (!req.body.roles || !Array.isArray(req.body.roles) || req.body.roles.length === 0) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "roles field must be filled");


    const password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null);

    const users = await Users.create(
      {
        email: req.body.email,
        password,
        is_active: true,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone_number: req.body.phone_number
      }
    )

    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN_ROLE,
      is_active: true,
      createdBy: users._id,
    })

    await UserRoles.create({
      user_id: users._id,
      role_id: role._id
    })

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})

module.exports = router;

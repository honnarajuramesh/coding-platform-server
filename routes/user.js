const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  console.log(req.body);
  try {
    const { error } = validate(req.body);
    if (error) {
      console.log("Inside req.boy error *************");
      return res.status(400).send({ message: error.details[0].message });
    }

    const user = await User.findOne({ email: req.body.email });

    if (user) {
      console.log("++ Inside User found ++");

      return res
        .status(409)
        .send({ message: "User with given email already exists!" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    console.log("### password hase ##");
    console.log(hashPassword);

    await new User({ ...req.body, password: hashPassword }).save();
    res.status(201).send({ message: "User created successfully." });
  } catch (error) {
    console.log("Error by MongoBd");
    console.log("------------------------------------");
    console.log(error);
    console.log("------------------------------------");

    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;

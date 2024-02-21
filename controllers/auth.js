const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("data : ", name, email,password)
    let user = await User.findOne({
      email,
    });
    console.log("here 0")
    if (user) {
        console.log("here 01")
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
    });

    console.log("here1")
    const token = await newUser.generateToken();
    console.log("here")
    res.status(200).json({
      success: true,
      token,
      newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.matchPasswords(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const token = await user.generateToken();

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
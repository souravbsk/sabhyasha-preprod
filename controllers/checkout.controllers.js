const { addresses } = require("../models/addressModel");
const { users } = require("../models/userModel");

const getAllShippingAddress = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res
        .status(400)
        .send({ success: false, message: "User id is required" });
    }
    const user = await users
      .findById(userId)
      .select("billingAddressIds shippingAddressIds displayName mobile");
    const shippingAdds = await addresses.find({
      user: userId,
      type: "shipping",
    });
    const billingAdds = await addresses
      .find({
        user: userId,
        type: "billing",
      })
      .select("-createdAt -updatedAt");

    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }
    res.status(200).send({
      success: true,
      shippingAddresses: shippingAdds,
      billingAddress: billingAdds,
      userData: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllShippingAddress,
};

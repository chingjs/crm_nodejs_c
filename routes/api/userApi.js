require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../../config/tables/user/User");
const Point = require("../../config/tables/user/Point");
const Address = require("../../config/tables/user/Address");

const Cart = require("../../config/tables/user/Cart");
const Otp = require("../../config/tables/user/Otp");
const { genUserID, getTotalEarn } = require("../../config/functions/misc");
const { authorizeMw } = require("../../config/middlewares/authorize");
const Product = require("../../config/tables/settings/item/Product");
const Transaction = require("../../config/tables/transaction/Transaction");
const Order = require("../../config/tables/transaction/Order");
const OrderItems = require("../../config/tables/transaction/OrderItems");
const { makeid } = require("../../config/functions/misc");
const VoucherType = require("../../config/tables/settings/voucher/VoucherType");
const Retailer = require("../../config/tables/store/Retailer");
const Event = require("../../config/tables/misc/Event");
const {
	registrationMessage,
} = require("../../config/functions/dynamicController");

const Voucher = require("../../config/tables/settings/voucher/Voucher");
const router = express.Router();
const moment = require("moment");
const { generateOtp, sendSMS } = require("../../config/functions/sms");
const SlackError = require("../../config/functions/slackBot");
const {
	giveUserPoint,
	checkIsExpiredDateByDateString,
} = require("../../config/functions/helperFunctions");
// const VoucherBatch = require("../../config/tables/settings/voucher/VoucherBatch");
const TierHistory = require("../../config/tables/misc/TierHistory");

router.post("/checkqr", async (req, res) => {
	const { id, referId } = req.body;
	try {
		if (id) {
			const findstorecode = await Retailer.findByPk(id);

			if (!findstorecode) {
				return (
					res
						.status(400)
						.json({ error: "Store code not found" })
				);
			}

			if (!findstorecode.first_scan_date) {
				findstorecode.first_scan_date = Date.now();
				await findstorecode.save();
			}
			const newEventRegister = Event.build({
				type: "scan",
				amount: 1,
				retailerId: findstorecode.id,
			});

			await newEventRegister.save();

			return res.status(200).json({ data: findstorecode });
		} else if (referId) {
			const findReferralCode = await User.findOne({
				where: { referralCode: referId },
			});

			if (!findReferralCode) {
				return res.status(400).json({ error: "Referral code not found" });
			}

		return res.status(200).json({
				refer: findReferralCode.referralCode,
				storeId: findReferralCode.retailerId,
			});
		} else {
			return res.status(200).json();
		}
	} catch (error) {
		SlackError("Error in checkqr API : \n", "Invalid QR", () => {
			return res.status(400).json({ error: "Invalid QR Code" });
		});
	}
});

router.post("/checkUser", async (req, res) => {
	const { number, language } = req.body;
	if (!number) {
		return res.status(400).json({ error: "Number not found" });
	}
	try {
		const findUser = await User.findOne({ where: { number } });
		const findOtp = await Otp.findOne({ where: { number } });

		if (findUser) {
			generateOtp(async (otp) => {
				findOtp.otp = otp;
				findOtp.expiredAt = getOtp5minsExpirationDate();

				await findOtp.save();

				const message = registrationMessage(otp, language);
				if (!message) {
					return res.status(400).json({
						error: "failed to get message",
					});
				}
				sendSMS(number, message);
			});
			return res.status(200).json({ identity: "login" });
		} else {
			return res.status(200).json({ identity: "register" });
		}
	} catch (error) {
		console.error("Error caught in checkUser api");
		console.error(error);
		return res.status(400).json({ error: "Internal Error" });
	}
});
router.post("/register", async (req, res) => {
	const { name, number, email, storeId, referId } = req.body;
	if (!name || !number || !email)
		return res
			.status(400)
			.json({ error: "Please ensure your have all the informations fill up!" });

	const user = await User.findOne({ where: { number, verified: true } });

	if (user) {
		return res.status(400).json({ error: "Number Registered." });
	}

	if (storeId) {
		const checkStore = await Retailer.findOne({ id: storeId });
		if (!checkStore) {
			return res.status(400).json({ error: "Store not found." });
		}
	}

	if (referId) {
		const referUser = await User.findOne({ where: { referralCode: referId } });
		if (!referUser) {
			return res.status(400).json({ error: "Refer id not found." });
		}
	}

	try {
		try {
			genUserID(async (err, referralCode) => {
				console.log("referralCode", referralCode);

				if (err) {
					return res.status(400).json({ error: "Internal Error" });
				}
				const newUser = new User({
					name,
					number: number,
					retailerId: storeId ? storeId : null,
					email: email,
					dob: new Date("2000-01-01"),
					referBy: referId ? referId : null,
					referralCode,
					verified: false,
					status: "REGISTERED",
					register_date: Date.now(),
					tier: "MEMBER",
				});

				const newUserSave = await newUser.save();
				if (!newUserSave) {
					return res.status(400).json({ error: "fail to save new user" });
				}

				const findOtp = await Otp.findOne({ where: { number } });
				if (!findOtp) {
					generateOtp(async (otp) => {
						const expiredAt = getOtp5minsExpirationDate();

						const newOTP = Otp.build({
							number,
							otp,
							expiredAt,
						});
						const message = registrationMessage(otp, "");
						if (!message) {
							return res.status(400).json({
								error: "failed to get message",
							});
						}
						const saveOtp = await newOTP.save();
						if (saveOtp) {
							sendSMS(saveOtp.number, message);
							return res.status(200).json({
								message: "send otp success",
								number,
							});
						} else {
							return res.status(400).json({
								error: "failed to send otp.",
							});
						}
					});
				} else {
					generateOtp(async (otp) => {
						findOtp.otp = otp;
						findOtp.expiredAt = getOtp5minsExpirationDate();
						const message = registrationMessage(otp);
						if (!message) {
							return res.status(400).json({
								error: "failed to get message",
							});
						}
						const saveOtp = await findOtp.save();
						if (saveOtp) {
							sendSMS(saveOtp.number, message);
							return res.status(200).json({
								message: "resend succes",
							});
						} else {
							console.log("Error sending OTP.");
							return res.status(400).json({
								error: "failed to send otp.",
							});
						}
					});
				}
			});
		} catch (error) {
			console.error("Error caught in creating register api with retailer id");
			console.error(error);
			return res.status(400).json({ error: "Internal Error" });
		}
	} catch (error) {
		console.error("Error caught in register api");
		console.error(error);
		return res.status(400).json({ error: "Internal Error" });
	}
	// }
});

router.post("/verify-otp", async (req, res) => {
	const { number, otp } = req.body;

	if (!number || !otp) {
		return res.status(400).json({ error: "Phone No or OTP is missing." });
	}
	try {
		const foundOtp = await Otp.findOne({ where: { number, otp } });
		if (!foundOtp) {
			return res.status(400).json({ error: "Please enter a valid OTP!" });
		} else {
			if (checkIsExpiredDateByDateString(foundOtp.expiredAt)) {
				return res.status(400).json({
					error: "You OTP has expired, please request again.",
				});
			}

			const getUser = await User.findOne({
				where: { number },
			});

			if (getUser && getUser.verified) {
				jwt.sign(
					{ id: getUser.id },
					process.env.JWT_SECRET,
					{ expiresIn: "12h" },
					(err, token) => {
						if (err) {
							console.error(
								"Error when signing a jwt token in getUserInfo : \n",
								err
							);
							callback("Internal Error", null);
						}
						const data = {
							token,
							user: getUser,
							message: "success",
						};
						return res.status(200).json(data);
					}
				);
			} else if (getUser && !getUser.verified) {
				getUser.verified = true;

				const tierResetDate = new Date();
				tierResetDate.setFullYear(tierResetDate.getFullYear() + 1);
				getUser.tierResetDate = tierResetDate;
				getUser.pointResetDate = tierResetDate;

				await getUser.save();
				jwt.sign(
					{ id: getUser.id },
					process.env.JWT_SECRET,
					{ expiresIn: "12h" },
					(err, token) => {
						if (err) {
							console.error(
								"Error when signing a jwt token in getUserInfo : \n",
								err
							);
							callback("Internal Error", null);
						}
						const data = {
							token,
							user: getUser,
							message: "success",
						};
						return res.status(200).json(data);
					}
				);
			}
		}
	} catch (error) {
		console.error("Error caught in verify api");
		console.error(error);
		return res.status(400).json({ error: "Internal Error" });
	}
});

router.post("/request-otp", async (req, res) => {
	const { number } = req.body;

	try {
		const checkOtp = await Otp.findOne({ where: { number } });
		if (!checkOtp) {
			generateOtp(async (otp) => {
				const expiredAt = getOtp5minsExpirationDate();

				const newOTP = Otp.build({
					number,
					otp,
					expiredAt,
				});
				const message = registrationMessage(otp);
				if (!message) {
					return res.status(400).json({
						error: "failed to get message",
					});
				}
				const saveOtp = await newOTP.save();
				if (saveOtp) {
					sendSMS(saveOtp.number, message);
					return res.status(200).json({
						message: "resend succes",
					});
				} else {
					return res.status(400).json({
						error: "failed to send otp.",
					});
				}
			});
		} else {
			generateOtp(async (otp) => {
				checkOtp.otp = otp;
				checkOtp.expiredAt = getOtp5minsExpirationDate();
				const message = registrationMessage(otp);
				if (!message) {
					return res.status(400).json({
						error: "failed to get message",
					});
				}
				const saveOtp = await checkOtp.save();
				if (saveOtp) {
					sendSMS(saveOtp.number, message);
					return res.status(200).json({
						message: "resend succes",
					});
				} else {
					return res.status(400).json({
						error: "failed to send otp.",
					});
				}
			});
		}
	} catch (err) {
		console.log("Error when finding customer in resendOtp");
		console.log(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});

// verify token
router.post("/session", authorizeMw, async (req, res) => {
	const foundUser = req.currentUser.data;
	if (!foundUser) {
		return res.status(400).json({ error: "User not found" });
	}
	const totalpoints = await getTotalEarn(foundUser.id);

	const registerReward = await Point.findOne({
		where: {
			userId: foundUser.id,
			source: "REGISTER",
		},
	});

	const checkTransaction = await Transaction.findAll({
		where: { userId: foundUser.id, active: true },
	});

	const checkItemOrder = await Order.findAll({
		where: { userId: foundUser.id },
		include: [{ model: OrderItems }],
	});

	const checkCartQuantity = await Cart.findAll({
		where: { userId: foundUser.id },
	});

	let getCartQuantity = 0;
	getCartQuantity +=
		checkCartQuantity &&
		checkCartQuantity.map((item) => item.qty).reduce((a, b) => a + b, 0);

	const getItem = [];
	const products = await Product.findAll({});
	for (let i = 0; i < checkItemOrder.length; i++) {
		let details = [];
		for (let j = 0; j < checkItemOrder[i].orderItems.length; j++) {
			if (checkItemOrder[i].orderItems[j].productId) {
				let image = products.filter(
					(p) => p.id === checkItemOrder[i].orderItems[j].productId
				)[0];

				details.push({
					...checkItemOrder[i].orderItems[j].dataValues,
					image: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${image?.itemImage}`,
					imageBM: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${image?.bmItemImage}`,
					imageCH: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${image?.chItemImage}`,
				});
			}
		}
		getItem.push({
			details,
			name: checkItemOrder[i].name,
			trackingId: checkItemOrder[i].trackingId,
			deliveryOption: checkItemOrder[i].deliveryOption,
			status: checkItemOrder[i].status,
			addressId: checkItemOrder[i].addressId,
			number: checkItemOrder[i].number,
			line1: checkItemOrder[i].line1,
			line2: checkItemOrder[i].line2,
			city: checkItemOrder[i].city,
			postcode: checkItemOrder[i].postcode,
		});
	}


	return res.status(200).json({
		userData: {
			...foundUser,
			register: registerReward ? true : false,
		},
		point: totalpoints,
		transactionData: checkTransaction,
		cart: 0,
		displayOrderedItems: checkItemOrder,
		displayCartQuantity: getCartQuantity,
		displayItems: getItem,
	});
});

// delivery address
router.post("/address/fetch", authorizeMw, async (req, res) => {
	try {
		const foundUser = req.currentUser.data;

		const foundData = await Address.findAll({
			where: { userId: foundUser.id },
		});
		return res.status(200).json({ data: foundData });
	} catch (err) {
		console.error("Error when finding address info");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});
router.post("/address/add", authorizeMw, async (req, res) => {
	const { data } = req.body;
	try {
		const foundUser = req.currentUser.data;
		const newAddress = Address.build({
			...data,
			userId: foundUser.id,
			active: false,
		});

		const savedAddress = await newAddress.save();
		return res.status(200).json({ data: savedAddress });
	} catch (err) {
		console.error("Error when finding user in add address");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});
router.post("/address/set", authorizeMw, async (req, res) => {
	const { address } = req.body;
	const action = address.action;

	try {
		const foundUser = req.currentUser.data;

		const foundData = await Address.findAll({
			where: { userId: foundUser.id },
		});

		if (action === "remove") {
			Address.destroy({ where: { userId: foundUser.id, id: address.id } });
		} else if (action === "default") {
			for (let a = 0; a < foundData.length; a++) {
				foundData[a].active = false;
				if (foundData[a].id === address.id) {
					foundData[a].active = true;
				}
				await foundData[a].save();
			}
		}

		return res
			.status(200)
			.json({ data: foundData, message: "Updated Successfully." });
	} catch (err) {
		console.error("Error when finding user in add address");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});
router.post("/address/update", authorizeMw, async (req, res) => {
	const { address } = req.body;
	const data = address;

	try {
		const foundUser = req.currentUser.data;
		const foundData = await Address.findOne({
			where: { userId: foundUser.id, id: data.addrId },
		});

		if (!foundData) {
			return res.status(400).json({ error: "Data not found" });
		}
		foundData.name = data.name;
		foundData.number = data.number;
		foundData.line1 = data.line1;
		foundData.line2 = data.line2;
		foundData.city = data.city;
		foundData.postcode = data.postcode;
		await foundData.save();

		return res.status(200).json({ message: "Updated Successfully" });
	} catch (err) {
		console.error("Error when finding user in add address");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});
router.post("/profile/update", authorizeMw, async (req, res) => {
	const { name, number, email, dob } = req.body;

	try {
		const foundUser = await User.findByPk(req.currentUser.data.id);
		if (!foundUser) return res.status(400).json({ error: "User not found" });

		const getNumber = await User.findOne({ where: { number: number } });
		if (getNumber && getNumber.id !== foundUser.id) {
			return res.status(400).json({ error: "existed phone no." });
		}

		foundUser.name = name;
		foundUser.number = number;
		foundUser.email = email;
		foundUser.dob = moment(dob).format("YYYY-MM-DD");
		await foundUser.save();

		return res.status(200).json({ message: "Updated Successfully" });
	} catch (err) {
		console.error("Error when finding user in edit user details");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});
router.post("/reward/fetch", authorizeMw, async (req, res) => {
	const foundUser = req.currentUser.data;
	const { value } = req.body;
	const filterDate = value;
	const today = new Date();
	const overview = new Date(today.getFullYear());
	const lastMonth = new Date(
		today.getFullYear(),
		today.getMonth() - 1,
		today.getDate()
	);
	const lastThreeMonths = new Date(
		today.getFullYear(),
		today.getMonth() - 3,
		today.getDate()
	);
	const lastSixMonths = new Date(
		today.getFullYear(),
		today.getMonth() - 6,
		today.getDate()
	);

	let query = { order: [["createdAt", "DESC"]] };

	if (filterDate === "overview") {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [overview, today],
			},
		};
	} else if (filterDate === "last_month") {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastMonth, today],
			},
		};
	} else if (filterDate === "last_three_months") {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastThreeMonths, today],
			},
		};
	} else {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastSixMonths, today],
			},
		};
	}

	let voucherList = [];

	try {
		const checkRewards = await Voucher.findAll({
			where: { userId: foundUser.id },
			include: [{ model: VoucherType }],
		});

		for (let p = 0; p < checkRewards.length; p++) {
			voucherList.push({
				voucherImage: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${checkRewards[p].voucherType?.voucherImage}`,
				name: checkRewards[p].voucherType?.name,
				voucherTypeId: checkRewards[p].voucherType?.id,
				amount: checkRewards[p].amount,
				code: checkRewards[p].code,
				dateuse: checkRewards[p]?.dateuse,
				type: checkRewards[p].type,
				shopper: checkRewards[p].shopper,
				redeemedDate: checkRewards[p].redeemedDate,
				redeemed: checkRewards[p].redeemed,
				createdAt: checkRewards[p].createdAt,
				used: checkRewards[p].used,
				id: checkRewards[p].id,
			});
		}
		return res.status(200).json({ voucherList: voucherList });
	} catch (err) {
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});
router.post("/voucher/used", authorizeMw, async (req, res) => {
	const { id } = req.body;
	try {
		const foundUser = req.currentUser.data;

		const foundData = await Voucher.findOne({
			where: { userId: foundUser.id, id },
		});

		if (!foundData) {
			return res.status(400).json({ error: "Data not found" });
		}

		foundData.used = true;
		foundData.dateuse = new Date();
		await foundData.save();
		return res.status(200).json({ message: "Updated Successfully." });
	} catch (err) {
		console.error("Error when finding voucher to set used");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});

router.post("/reward/register/get", authorizeMw, async (req, res) => {
	const foundUser = req.currentUser.data;

	try {
		const checkRewards = await Point.findOne({
			where: { userId: foundUser.id, source: "REGISTER" },
		});
		if (!checkRewards) {
			console.log("No register reward yet");
			const callPoint = await giveUserPoint({
				source: "REGISTER",
				points: 10,
				sourceId: null,
				userId: foundUser.id,
			});

			if (!callPoint) {
				return res.status(400).json({ error: "Error in giving user point" });
			}
		} else {
			console.log("have register reward");
		}

		return res.status(200).json({ message: "success" });
	} catch (err) {
		console.error("Error when giving register reward");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});

router.post("/tier/history/fetch", authorizeMw, async (req, res) => {
	let requirePoint = 0;
	let nextTier = "";
	try {
		const foundUser = req.currentUser.data;

		const foundData = await TierHistory.findAll({
			where: { userId: foundUser.id },
			order: [["createdAt", "desc"]],
		});

		const currentPoints = await getTotalEarn(foundUser.id);

		let date =
			foundData && foundData.length
				? foundData[0].createdAt
				: foundUser.createdAt;

		if (currentPoints >= 0 && currentPoints <= 250) {
			requirePoint += 250 - currentPoints;
			nextTier = "BRONZE";
		} else if (currentPoints >= 250 && currentPoints <= 600) {
			requirePoint += 600 - currentPoints;
			nextTier = "SILVER";
		} else if (currentPoints >= 600 && currentPoints <= 1000) {
			requirePoint += 1000 - currentPoints;
			nextTier = "GOLD";
		}

		date.setFullYear(date.getFullYear() + 1);
		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
		const year = date.getFullYear();
		const formattedDate = `${day}/${month}/${year}`;

		return res.status(200).json({
			tierHistory: foundData,
			currentPoints,
			expired: `${formattedDate}`,
			requirePoint,
			nextTier,
		});
	} catch (err) {
		console.error("Error when finding tier history info");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});

module.exports = router;

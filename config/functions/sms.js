/* eslint-disable no-console */
require("dotenv").config();
const Otp = require("../tables/user/Otp");
const fetch = require("node-fetch");
const {
	getOtp5minsExpirationDate,
	checkIsExpiredDateByDateString,
} = require("./helperFunctions");
const { APIUSERNAME, APIPASSWORD, NODE_ENV, APICOMPANY } = process.env;
const generateOtp = (callback) => {
	const max = 9999;
	const min = 1111;
	const otp = Math.floor(Math.random() * (max - min + 1)) + min;
	console.log(`Generated OTP : ${otp}`);
	callback(otp);
};
const sendSMS = (number, message) => {
	NODE_ENV === "production" &&
		fetch(
			`https://smshubs.net/api/sendsms.php?email=${APIUSERNAME}&key=${APIPASSWORD}&recipient=${number}&&message=${APICOMPANY}: ${message}`
		)
			.then((status) => {
				console.log("sent sms");
				// callback(status);
			})
			.catch((err) => {
				console.error("Error when sending SMS : ");
				console.error(err);
				// callback(err);
			});
	// callback()
};

const sendMessage = async (options) => {
	const { type, number, amount, code, reason, url } = options;
	if (type === "verification") {
		const foundOtp = await Otp.findOne({ where: { number } });
		const isValidOtp =
			foundOtp && !checkIsExpiredDateByDateString(foundOtp.expiredAt);

		if (isValidOtp) {
			const message = `Your one time verification code is ${foundOtp.otp}`;
			sendSMS(number, message);
			console.log("foundOtp", foundOtp.otp);
			return;
		} else {
			const otp = generateOtp(4);
			const message = `Your one time verification code is ${otp}`;
			sendSMS(number, message);
			console.log("foundOtp", otp);

			const expiredAt = getOtp5minsExpirationDate();

			const newOtp = new Otp({
				number,
				otp,
				expiredAt,
			});
			newOtp.save();
			return;
		}
	} else if (type === "approved") {
		const message = `Congratulations! Your receipt was approved. The RM${amount} Touch 'n Go e-Wallet Reload Pin is ${code}.`;
		sendSMS(number, message);
		return;
	} else if (type === "rejected") {
		const message = `Please resubmit your receipt at: ${url} as your receipt is rejected due to ${reason}`;
		// Your receipt was rejected,because of ${reason}. Resubmit at this ${url}`
		// Rm0.00 Relx: Please resubmit your receipt at: [Link] as your receipt is rejected due to [Reason]
		sendSMS(number, message);
		return;
	} else {
		return;
	}
};
module.exports = {
  generateOtp,
  sendSMS,
  sendMessage,
};

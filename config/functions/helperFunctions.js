const { Op } = require("sequelize");
const User = require("../tables/user/User");
const Point = require("../tables/user/Point");
const TierSetting = require("../tables/misc/TierSetting");
const TierHistory = require("../tables/misc/TierHistory");
const SlackError = require("../../config/functions/slackBot");

const checkIsExpiredDateByDateString = (_checkDate) => {
	return new Date() > new Date(_checkDate);
};


const checkUpgradeTier = async (userId) => {
	try {
		const user = await User.findOne({ where: { id: userId, verified: true } });

		if (!user) {
			SlackError("User not found in upgrading: \n", userId, () => {
				console.log("User not found in upgrading", userId);
			});
			return false;
		}

		const foundSettings = await TierSetting.findOne({
			where: { tier: user.tierStatus },
		});

		if (!foundSettings) {
			SlackError("Tier Setting not found in upgrade tier: \n", userId, () => {
				console.log("Tier Setting not found in upgrade tier", userId);
			});
			return false;
		}

		let remainingPoints = user.totalPoint;
		if (
			remainingPoints > foundSettings.highTierPoints &&
			user.tierStatus !== "GOLD"
		) {
			const checkTier = await TierSetting.findOne({
				where: {
					lowTierPoints: { [Op.lte]: remainingPoints },
					highTierPoints: { [Op.gte]: remainingPoints },
				},
			});

			if (
				remainingPoints >= checkTier.lowTierPoints &&
				user.tierStatus !== checkTier.tier
			) {
					// Create a tier upgrade history entry
				const newHistory = await TierHistory.create({
					userId: user.id,
					tierChangeDate: new Date(),
					action: "UPGRADE",
					oldtier: user.tierStatus,
					newtier: checkTier.tier,
				});

				if (newHistory) {
					user.tierStatus = checkTier.tier;
					const saveUser = await user.save();

					if (saveUser) {
						const checkBronze = await Point.findOne({
							where: { userId: user.id, source: "BRONZE" },
						});

						const checkGold = await Point.findOne({
							where: { userId: user.id, source: "GOLD" },
						});
						const checkSilver = await Point.findOne({
							where: { userId: user.id, source: "SILVER" },
						});

						let currPoint = 0;

						if (user.tierStatus === "BRONZE" && !checkBronze) {
							const newPoint = await Point.create({
								source: "BRONZE",
								points: 15,
								sourceId: null,
								active: true,
								userId: user.id,
							});
							if (newPoint) {
								currPoint = parseFloat(user.totalPoint);
								currPoint += 15;
								user.totalPoint = currPoint;
								await user.save();
							}
						} else if (user.tierStatus === "SILVER" && !checkSilver) {
							const newPoint = await Point.create({
								source: "SILVER",
								points: 20,
								sourceId: null,
								active: true,
								userId: user.id,
							});
							if (newPoint) {
								currPoint = parseFloat(user.totalPoint);
								currPoint += 20;
								user.totalPoint = currPoint;
								await user.save();
							}
						} else if (user.tierStatus === "GOLD" && !checkGold) {
							const newPoint = await Point.create({
								source: "GOLD",
								points: 25,
								sourceId: null,
								active: true,
								userId: user.id,
							});
							if (newPoint) {
								currPoint = parseFloat(user.totalPoint);
								currPoint += 25;
								user.totalPoint = currPoint;
								await user.save();
							}
						}
					} else {
						SlackError("Error when upgrading user tier \n", err, () => {
							return false;
						});
					}
				}
			} else {
				SlackError("Error when upgrading user tier \n", err, () => {
					return false;
				});
			}
		}
	} catch (err) {
		SlackError("Error when checking/upgrading tier \n", err, () => {
			return false;
		});
	}
};

const getFormattedToday = () => {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	const formattedToday = `${year}-${month}-${day}`;
	return formattedToday;
};

const pointMultiplication = async (id) => {
	try {
		const foundUser = await User.findOne({ where: { id, verified: true } });
		if (!foundUser) {
			SlackError("User not found in pointMultiplication: \n", id, () => {
				console.log("User not found in pointMultiplication", id);
			});
		}
		const foundSettings = await TierSetting.findOne({
			where: { tier: foundUser.tierStatus },
		});
		if (!foundSettings) {
			SlackError(
				"Tier Setting not found in pointMultiplication: \n",
				id,
				() => {
					console.log("Tier Setting not found in pointMultiplication", id);
				}
			);
		}
		let multiplication = foundSettings.multiplier;
		return multiplication;
	} catch (err) {
		SlackError("Error in pointMultiplication: \n", id, () => {
			console.log("User not found in pointMultiplication");
		});
	}
};

const giveUserPoint = async ({ source, points, sourceId, userId }) => {
	const today = new Date(); // 2023-09-11T02:24:05.700Z
	const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2); // 2023-09-01T16:00:00.000Z
	const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1); // 2023-09-30T16:00:00.000Z

	const checkUser = await User.findOne({ where: { id: userId } });
	let currPoint = 0;

	const checkMaxPoint = await Point.sum("points", {
		where: {
			userId,
			active: true,
			points: { [Op.gt]: 0 },
			createdAt: {
				[Op.between]: [startOfMonth, endOfMonth],
			},
		},
	});

	// check if currPoint is less than 1500
	if (checkMaxPoint < 1500) {
		// this will deduct total points with current points user have so far
		const maxPointsToAdd = 1500 - checkMaxPoint;

		// if incoming points are lesser than the points left
		if (points <= maxPointsToAdd) {
			const newPoint = Point.build({
				source,
				points,
				sourceId,
				userId,
				active: true,
			});

			const savePoint = await newPoint.save();

			if (checkUser && source !== "ORDER") {
				currPoint = parseFloat(checkUser.totalPoint) || 0;
				currPoint += points;
				checkUser.totalPoint = currPoint;
				// console.log("if no remaining", currPoint);
			}
			await checkUser.save();
			return savePoint;

			//else statement will use maxPointsToAdd to sum up the points and saved the remaining points user has after reaching 1500 points
		} else {
			const remainingPoints = points - maxPointsToAdd;

			const newPoint = Point.build({
				source,
				points: maxPointsToAdd,
				sourceId,
				userId,
				active: true,
			});

			const savePoint = await newPoint.save();

			if (checkUser) {
				currPoint = parseFloat(checkUser.totalPoint) || 0;
				currPoint += remainingPoints;
				checkUser.totalPoint = currPoint;
			}
			await checkUser.save();

			return { savedPoint: savePoint, remainingPoints: remainingPoints };
		}
	} else {
		return { message: "User already received the max points of the month" };
	}
};

module.exports = {
	checkIsExpiredDateByDateString,
	getOtp5minsExpirationDate,
	checkUpgradeTier,
	getFormattedToday,
	pointMultiplication,
	giveUserPoint,
};

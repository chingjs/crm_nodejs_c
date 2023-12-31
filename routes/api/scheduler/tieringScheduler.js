const schedule = require("node-schedule");
const { Op } = require("sequelize");
const User = require("../../../config/tables/user/User");
const Point = require("../../../config/tables/user/Point");
const TierSetting = require("../../../config/tables/misc/TierSetting");
const TierHistory = require("../../../config/tables/misc/TierHistory");
const {
  getFormattedToday,
} = require("../../../config/functions/helperFunctions");

module.exports = () => {
  schedule.scheduleJob("0 0 0 * * *", () => {
    const downgradeFunction = async () => {
      try {
        const formattedToday = getFormattedToday();
        const tierResetDate = new Date();
        tierResetDate.setFullYear(tierResetDate.getFullYear() + 1);
        const foundUsers = await User.findAll({
          where: { tierResetDate: formattedToday },
          include: [
            {
              model: Point,
              where: { points: { [Op.gt]: 0 } },
              required: false,
            },
          ],
        });
        const settings = await TierSetting.findAll({});
        let tierObj = {};
        for (let i = 0; i < settings.length; i++) {
          const setting = settings[i];
          tierObj[setting.tier] = {
            highTierPoints: setting.highTierPoints,
            lowTierPoints: setting.lowTierPoints,
            beforeTier: setting.beforeTier,
          };
        }

        for (const user of foundUsers) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

          const totalPointsInPastYear = user.points.reduce((total, point) => {
            const pointDate = new Date(point.createdAt);
            const tierResetDate = new Date(user.tierResetDate);
            // Check if the point is positive and its createdAt date falls within the past year from the tierResetDate
            if (
              parseFloat(point.points) > 0 &&
              pointDate >= oneYearAgo &&
              pointDate <= tierResetDate
            ) {
              total += point.points;
            }
            return total;
          }, 0);

          const userTierObj = tierObj[user.tierStatus];
          if (
            totalPointsInPastYear >= userTierObj.lowTierPoints &&
            totalPointsInPastYear <= userTierObj.highTierPoints
          ) {
            user.tierResetDate = tierResetDate;
            await user.save();
            console.log("User points can maintain their tier:", user.id);
          } else {
            const beforeTier = userTierObj.beforeTier;

            const newHistory = await TierHistory.create({
              userId: user.id,
              tierChangeDate: new Date(),
              oldtier: user.tierStatus,
              newtier: beforeTier,
              action: "DOWNGRADE",
            });

            const newPoint = await Point.update(
              { active: false },
              { where: { active: true, userId: user.id } }
            );
            if (!newHistory || !newPoint) {
              user.tierResetDate = tierResetDate;
              user.tierStatus = beforeTier;
              await user.save();
              console.log("User tier downgraded for user ID:", user.id);
            }
          }
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    downgradeFunction();
  });
  // scheduleJobNow();
};

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { BOOLEAN, DATEONLY, STRING, FLOAT } = DataTypes;

class Point extends Model { }

Point.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		source: {
			type: STRING,
			allowNull: true,
			comment: "Source of point, Refer || Scan || Order || Voucher"
		},
		points: {
			type: FLOAT,
			allowNull: false,
			comment: "Total points collected/spent"
		},
		sourceId: {
			type: STRING,
			allowNull: true,
			comment: "To identify the source"
		},
		active: {
			type: BOOLEAN,
			allowNull: true,
			comment: "to indicate zerolise"
		},
		pointResetDate: {
			type: DATEONLY,
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "To track all user's points",
		tableName: "point",
		modelName: "point"
	}
);

// userId

module.exports = Point;

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { INTEGER, UUIDV4, STRING } = DataTypes;

class AdminLogs extends Model {}

AdminLogs.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		description: {
			type: STRING,
			allowNull: false,
			comment: "log message"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "logs for every admin actions",
		tableName: "adminLogs",
		modelName: "adminLogs"
	}
);

module.exports = AdminLogs;

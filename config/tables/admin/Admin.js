const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, UUIDV4, STRING } = DataTypes;

class Admin extends Model {}

Admin.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		username: {
			type: STRING,
			allowNull: false,
			comment: "admin user name"
		},
		password: {
			type: STRING,
			allowNull: false,
			comment: "admin password"
		},
		role: {
			type: STRING,
			allowNull: false,
			comment: "role of this account"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "Admin database",
		tableName: "admin",
		modelName: "admin"
	}
);

module.exports = Admin;

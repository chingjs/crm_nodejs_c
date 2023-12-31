const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../sequelize');

const { INTEGER, DATEONLY, STRING, DATE, BOOLEAN } = DataTypes;

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    name: {
      type: STRING,
      allowNull: false,
      comment: 'user name',
    },
    number: {
      type: STRING,
      // unique: true, 
      // primaryKey: true,
      allowNull: true,
      comment: 'user phone number',
    },
    email: {
      type: STRING,
      allowNull: false,
      comment: 'user email address',
    },
    dob: {
      type: DATE,
      // allowNull: false,
      allowNull: true,
      comment: 'Date of Birth',
    },
    referralCode: {
      type: STRING,
      allowNull: true,
      comment: "user's referral code to be shared",
    },
    referBy: {
      type: STRING,
      allowNull: true,
      comment: 'referrer user id',
    },
    refer: {
      type: BOOLEAN,
      defaultValue: false,
      comment: 'is referred',
    },
    verified: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'is verified',
    },
    tierResetDate: {
			type: DATEONLY,
			allowNull: true,
			comment: "tier reset date after a year"
		},
    tierStatus: {
			type: STRING,
			allowNull: false,
      defaultValue: 'MEMBER',
			comment: "user current tier status"
		},
    totalPoint: {
			type: STRING,
			allowNull: true,
			comment: "user current total tier point"
		},
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: 'To store all user details',
    tableName: 'user',
    modelName: 'user',
  }
);

module.exports = User;
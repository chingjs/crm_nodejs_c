require('dotenv').config();
const express = require('express');
const { Op } = require('sequelize');
//Store
const Retailer = require('../../config/tables/store/Retailer');
const router = express.Router();


router.post("/getAllStores", async (req, res) => {
  const result = [];
  const stores = await Retailer.findAll({});

  for (let i = 0; i < stores.length; i++) {
    if (!result.includes(stores[i].name)) {
      result.push(stores[i].name);
    }
  }
  const mapStores = result.map((store) => ( store));
  return res.status(200).json({ data: mapStores });
});


router.post("/storeLocator/fetch", async (req, res) => {
  const result = [];
  const getState = [];
  const stores = await Retailer.findAll({ where: { collect: true, name: {[Op.ne]: '' } }});

  for (let i = 0; i < stores.length; i++) {
    if (!result.includes(stores[i].name)) {
      result.push(stores[i].name);
    }

    if (!getState.includes(stores[i].state)) {
      getState.push(stores[i].state);
    }
  }
  return res.status(200).json({ mapStores: stores, mapStates: getState })
});


router.post("/getAllSku", async (req, res) => {
  const sku = await SKU.findAll({});

  const mapSku = sku.map((data) => ({
    label: data.name,
    value: data.name,
  }));
  return res.status(200).json({ data: mapSku });
});


module.exports = router;

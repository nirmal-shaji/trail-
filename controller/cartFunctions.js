var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var usersModel = require("../model/userSchema");
var categoryModel = require("../model/categorySchema")
var productModel = require('../model/productSchema');
var cartModel = require("../model/cartSchema");
const product = require("../model/productSchema");

module.exports = {
    totalAmount: (cartdata) => {
        total = cartdata.products.reduce((acc, curr) => {
            acc += ((curr.productId.amount - curr.productId.discount) * curr.quantity);
            return acc;
        }, 0);
        return total;
    }
}
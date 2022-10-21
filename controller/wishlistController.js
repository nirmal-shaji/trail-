var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var usersModel = require("../model/userSchema");
var categoryModel = require("../model/categorySchema")
var productModel = require('../model/productSchema');
var wishlistModel = require('../model/wishlistSchema');
const product = require("../model/productSchema");
const cartFunctions = require('./cartFunctions');


module.exports = {
    addWishlist: async (req, res, next) => {
        try {
                  const productId = req.body.product;
        let userId = req.session.userId;
        wishlist = await wishlistModel.findOne({ userId: userId._id }).lean();
        if (wishlist) {
            productexist = await wishlistModel.findOne({ userId: userId._id, "products.productId": productId });
            if (productexist) 
               return res.json({message:"product already added to wishlist"})
                await wishlistModel.findOneAndUpdate({ userId: userId._id }, { $push: { products: { productId: productId } } });
        
        }
        else { await wishlistModel.create({ userId: userId._id, products: { productId: productId } }); }
        wishlistData = await wishlistModel.findOne(
            { userId: userId._id }
        ).populate("products.productId").lean();
        price = (wishlistData.products[0].productId.amount - wishlistData.products[0].productId.discount);
      
        await wishlistModel.updateOne({ userId: userId._id, "products.productId": productId },  { "products.$.price": price }) 
        } catch (error) {
            next(error);  
        }
 
    },
    wishlistData: async (req, res, next) => {
        try {
            userId = req.session.userId;
        
        wishlistDatas = await wishlistModel.findOne(
            { userId: userId._id }
        ).populate("products.productId").lean();
        if (wishlistDatas) {
            if (!wishlistDatas.products[0]) {
                res.render('user/emptywishlist');
            }
        stocks = await Promise.all(wishlistDatas.products.map( async(i) => {
            
            stock = await productModel.findOne({ _id: i.productId._id }, { _id: 0, stock: 1 }).lean();
            
            return stock;
        }));
     
      
        
            res.render('user/wishlist', { userheader: true, wishlistDatas,stocks })
        }
        else {
            res.render('user/emptywishlist')
        } 
        } catch (error) {
            next(error);  
        }
       
    },
    delete: async (req, res, next) => {
        try {
             productId = req.body.product
       
        userId = req.session.userId
        
       deletes = await wishlistModel.updateOne({ userId: userId._id }, { $pull: { products: { productId: req.body.product } } }) 
        } catch (error) {
            next(error); 
        }
        
    }
    


}
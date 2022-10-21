var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var usersModel = require("../model/userSchema");
var categoryModel = require("../model/categorySchema")
const productModel = require('../model/productSchema');
var cartModel = require("../model/cartSchema");
const addressModel = require('../model/addressSchema');
const wishlistModel = require('../model/wishlistSchema');
const couponModel=require('../model/couponSchema')

const orderModel = require('../model/orderSchema');
const razorpay=require('./razorpayController')
const cartFunctions = require('./cartFunctions');
const { findOne } = require("../model/userSchema");








module.exports = {
    cart: async (req, res, next) => {
        try {
                 const productId = req.body.product;
        let userId = req.session.userId;
        cart = await cartModel.findOne({ userId: userId._id }).lean();
        stock = await productModel.findOne({ _id: productId }, { _id: 0, stock: 1 }).lean();
        if (stock.stock<=0) 
         return res.json({message:'sorry the product is out of stock click the link below to move back to home'})            
         if (cart) {
                productexist = await cartModel.findOne({ userId: userId._id, "products.productId": productId });
                if (productexist) {
                    await cartModel.updateOne({ userId: userId._id, "products.productId": productId }, { $inc: { "products.$.quantity": 1 } });
                }
                else {
                    await cartModel.findOneAndUpdate({ userId: userId._id }, { $push: { products: { productId: productId, quantity: 1 } } });
                }
            }
            else
            {
                await cartModel.create({ userId: userId._id, products: { productId: productId, quantity: 1 } });
        }
        if (req.body.wishlist) {
            await wishlistModel.updateOne({ userId: userId._id }, { $pull: { products: { productId: req.body.product } } });  
        }
        
        return res.json({ message: 'success' });
        } catch (error) {
            next(error);  
        }
  
        
    },
    increment: async (req, res, next) => {
        try {
             stock = await productModel.findOne({ _id: req.body.product}, { _id: 0, stock: 1 }).lean();
        if (stock.stock<=0) {
         return res.json({message:'sorry the product is out of stock click the link below to move back to cart'})            
        }
        const quantities = parseInt(req.body.quantity)
       
        userId = req.session.userId;
         await cartModel.updateOne({ userId: userId._id, "products.productId": req.body.product },  { "products.$.quantity": quantities });
         cartData = await cartModel.findOne(
            { userId: userId._id, "products.productId": req.body.product}
        ).populate("products.productId").lean();
        price = (cartData.products[req.body.index].productId.amount - cartData.products[req.body.index].productId.discount) * cartData.products[req.body.index].quantity
        quantity = cartData.products[req.body.index].quantity;
        totalAmount = await cartFunctions.totalAmount(cartData);
        return res.json({ message: "the product is incremented",quantity,price, totalAmount })
        } catch (error) {
            next(error); 
        }
       
        
    },
    cartData: async (req, res, next) => {
        try {
             userId = req.session.userId;
        cartData = await cartModel.findOne(
            { userId: userId._id }
        ).populate("products.productId").lean();
        
        var totalAmount;
        if(cartData){
        // To check whether a cart is emypty-------------------------------------------------------------------
        if (cartData.products[0]) {
            totalAmount = await cartFunctions.totalAmount(cartData);
            return res.render('user/cart', { userheader: true, cartData, totalAmount })
            }
            res.render('user/emptycart', { userheader: true });
    }
        else {
            res.render('user/emptycart', { userheader: true });
        }
        } catch (error) {
            next(error); 
        }
       
    } ,
    




    delete: async (req, res, next) => {
        try {
             productId = req.body.product
        userId = req.session.userId
        deletes = await cartModel.updateOne({ userId: userId._id }, { $pull: { products: { productId: req.body.product } } })
        cartData = await cartModel.find({ userId: userId._id }).lean();
        return res.status(200).json({ message: "the product is successfully deleted" });
        } catch (error) {
            next(error); 
        }
       
        
    },
    renderCheckout: async (req, res, next) => {
        try {
             userId = req.session.userId;
        address = await addressModel.find({ userId: userId._id }).lean();
        cartData = await cartModel.findOne({ userId: userId._id }).populate("products.productId").lean();
        productData = cartData.products;
        totalAmount = await cartFunctions.totalAmount(cartData);
        couponData = await couponModel.find().lean();
        res.render('user/checkout',{userheader: true,address,productData,totalAmount,cartData,couponData}); 
        } catch (error) {
            next(error); 
        }
         
    },
    checkoutAddressChange: async (req, res, next) => {
        try {
              userId = req.session.userId;
        address = await addressModel.find({ userId: userId._id, _id: req.body.address }).lean();
        req.session.addressId = req.body.address;
        res.json({message:"success", address });
        } catch (error) {
            next(error);   
        }
       
      
    },
    renderConfirmation: async (req, res, next) => {
        try {
             req.body.userId = req.session.userId._id;
        cartData = await cartModel.findOne({ userId: req.body.userId }, { _id: 0, products: 1 }).populate("products.productId").lean();
        totalAmount = await cartFunctions.totalAmount(cartData);
        if(req.session.coupon){
            amountPaid = totalAmount - req.session.coupon.discountAmount;
            req.body.discount = req.session.coupon.discountAmount;
            await couponModel.findOneAndUpdate({ _id: req.session.coupon._id }, { users: { couponStatus: "Invalid" } });
            delete req.session.coupon;
        }
        else {
            amountPaid = totalAmount;
        }
        req.body.amountPaid = amountPaid;
        req.body.totalAmount = totalAmount;
        req.body.products = cartData.products;
        req.body.paymentType = "C.O.D";
        orderData = await orderModel.create(req.body)
        
        await Promise.all(orderData.products.map(async (i) => {
            productData = await productModel.findOne({ _id: i.productId }).lean();
          
            stock = productData.stock - i.quantity;
            await productModel.findOneAndUpdate({ _id: i.productId }, { stock: stock });
           
        }));
        
        orderDataPopulated = await orderModel.findOne({ _id: orderData._id }).populate("products.productId").lean();
        req.session.confirmationData = { orderDataPopulated, amountPaid };
        res.json({ message: "sucessfull" });
        } catch (error) {
            next(error);   
        }
       
    },
    intiatePay: async (req, res, next) => {
        try {
            req.body.userId = req.session.userId._id;
        cartData = await cartModel.findOne({ userId: req.body.userId }, { _id: 0, products: 1 }).populate("products.productId").lean();
        totalAmount = await cartFunctions.totalAmount(cartData);
        if (req.session.coupon) {
            amountPaid = totalAmount - req.session.coupon.discountAmount;
            req.body.discount = req.session.coupon.discountAmount;
            delete req.session.coupon;
        }
        else {
            amountPaid = totalAmount;
        }
        req.body.products = cartData.products;
        req.body.paymentType = "Online Payment";
        req.body.totalAmount = totalAmount;
        req.body.amountPaid = amountPaid;
        
        orderData = await orderModel.create(req.body)
        
        await cartModel.findOneAndDelete({ userId: req.body.userId });
        orderDataPopulated = await orderModel.findOne({ _id: orderData._id }).populate("products.productId").lean();
       
        totalAmounts = amountPaid * 100;
        razorData = await razorpay.intiateRazorpay(orderData._id, totalAmounts);
        await orderModel.findOneAndUpdate({ _id: orderData._id }, { orderId: razorData.id });
        razorId = process.env.RAZOR_PAY_ID;
        
        req.session.confirmationData = { orderDataPopulated, amountPaid };
        
        res.json({ message:'success',totalAmounts,razorData,orderData});
        } catch (error) {
            next(error);   
        }
        

    },
    confirmationPage: async (req, res, next) => {
        try {
          userId = req.session.userId;
        await cartModel.findOneAndDelete({ userId: userId});
        orderDataPopulated = req.session.confirmationData.orderDataPopulated
        totalAmount = req.session.confirmationData.amountPaid; 
        delete req.session.confirmationData; 
        res.render('user/order_confirmation',{ userheader: true, orderDataPopulated, totalAmount });   
        } catch (error) {
            next(error); 
        }
       
    },
    verifyPay: async (req, res, next) => {
        try {
            success= await razorpay.validate(req.body);
        if (success)
        { 
            orderData = await orderModel.findOneAndUpdate({ orderId: req.body['razorData[id]'] }, { paymentStatus: "success" }).lean();
            console.log(orderData);
            await Promise.all(orderData.products.map(async (i) => {
                productData = await productModel.findOne({ _id: i.productId }).lean();
              
                stock = productData.stock - i.quantity;
                await productModel.findOneAndUpdate({ _id: i.productId }, { stock: stock });
               
            }));
           
           return res.json({ status: "true" });
        }
        else
        {
            await orderModel.findOneAndUpdate({ orderId: req.body['razorData[id]'] }, { paymentStatus: "failed" });
            return res.json({ status: "failed" });
            }
        } catch (error) {
            next(error); 
        }
        
        
    },
    validateCoupon: async (req, res, next) => {
        try {
            userId = req.session.userId;
       
        couponExist = await couponModel.findOne({couponCode:req.body.couponId,"users.userId": userId }).lean();
        
        coupons = await couponModel.findOne({ couponCode: req.body.couponId }).lean();
       
        currentDate = new Date();
  
        if (coupons) {
        if(couponExist){
         
            return res.json({ message: 'couponUsed' });    
        }
        if (currentDate > coupons.expiryDate) 
        return res.json({ message: "couponExpired" });   
        
         
       
         if (req.body.total < coupons.minAmount)
         return res.json({ message: "couponMin" });
      
         await couponModel.findOneAndUpdate({ couponCode: req.body.couponId }, { users: { userId: userId } });
            
           
            
           
            newTotal = req.body.total - coupons.discountAmount;
            req.session.coupon = coupons;
           return res.json({ message: "success",coupons,newTotal});
            
    
        }
        return res.json({ message:"couponInvalid" });
        } catch (error) {
            next(error);
        }
        
      }
     
   
 }
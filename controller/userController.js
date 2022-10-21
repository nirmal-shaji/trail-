var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var usersModel = require("../model/userSchema");
var categoryModel = require("../model/categorySchema");
var productModel = require('../model/productSchema');
var addressModel = require('../model/addressSchema');
const couponModel = require('../model/couponSchema');
const orderModel = require('../model/orderSchema');
const bannerModel = require('../model/bannerSchema');
const bcrypt = require("bcrypt");
const otp=require('./otp');
const { VerificationAttemptContext } = require("twilio/lib/rest/verify/v2/verificationAttempt");

const { findOneAndUpdate } = require("../model/userSchema");

module.exports = {
  home: async (req, res, next) => {
    try {
      categoryData=await categoryModel.find().lean()
    productDatas = await productModel.find().lean();
    bannerData = await bannerModel.find().populate('productId').lean();
   
    if (req.session.userLogin) 
    return res.render('user/index',{userheader:true,productDatas,categoryData,bannerData});
    
    res.render('user/index',{guestheader:true,productDatas,categoryData,bannerData});
    } catch (error) {
      next(error);
    }
    
  },
  

  signup: async (req, res) => {
    try {
       let emailexist = await usersModel.findOne({ email: req.body.email });
    if(emailexist) {
      return response.send('user already exist');
    }
    req.body.block = false;
    const newuser = await usersModel.create(req.body);
    otp.doSms(newuser);
    const id = newuser._id;
    res.render('user/otp',{id});
    } catch (error) {
      next(error);
    }
   

  },


  loginpage: (req, res, next) => {
    try {
      if (req.session.userLogin)
        return res.redirect('/');
    if (req.session.userEmail)
    {
      userEmail = true;
      delete req.session.userEmail;
      return res.render('user/login',{userEmail});
    }
    if (req.session.userPassword) {
      userPassword = true;
      delete req.session.userPassword;
      return res.render('user/login',{userPassword});
      
    }
    if (req.session.userBlock) {
      userBlock = true;
      delete req.session.userBlock;
      return res.render('user/login',{userBlock});
    }
   return res.render('user/login');
    } catch (error) {
      next(error);
    }
  
    
  },
  

  userLogin: async (req, res, next) => {
    try {
       const { email, password } = req.body;
    const user = await usersModel.findOne({ email: email });
    if (!user)
    {
      req.session.userEmail = true;
      return res.redirect('/login');
      }
      // return res.json({ message: "email is invalid" })
    var correct = await bcrypt.compare(password, user.password);
    if (!correct) {
      req.session.userPassword = true;
      return res.redirect('/login');
    }
      // return res.json({ msg: "password invalid" });
    block = await usersModel.findOne({ email: email }, { _id: 0, block: 1 })
    if (block.block) {
      req.session.userBlock = true;
      return res.redirect('/login');
      // return res.json({ msg: "sorry user is blocked try contacting customer helpline number" });
    }
    req.session.userLogin = true;
    req.session.userId = await usersModel.findOne({ email: email }, { _id: 1 }).lean();
    res.redirect("/");
    } catch (error) {
      next(error);
    }
   
  },
  signuppage: (req, res, next) => {
    try {
      
    res.render('user/signup');
    } catch (error) {
      next(error);
    }
   },


  otpVerify: async (req, res, next) => {
    try {
       otps = req.body.otp;
    if (req.session.changeNumber) {
      
      verification=await otp.otpVerify(otps, req.session.changeNumber);
      if (verification) {
       
        await usersModel.findOneAndUpdate({ _id: req.session.userId }, { $set: { phone_number: req.body.phone_number } });
        
      }
      delete req.session.changeNumber;
      res.redirect('/user_profile');
      }
    const userdata = await usersModel.findOne({ _id: req.params.id }).lean();
     
    verification=await otp.otpVerify(otps, userdata);
    if (verification) {
     req.session.userLogin = true;
     userData= await usersModel.findOneAndUpdate({ _id: req.params.id }, { otpVerified: true }).lean();
      req.session.userId = userData;
      res.redirect('/');
    }
    else {
      await usersModel.findOneAndDelete({ _id: req.params.id });
      req.session.otpFailed = true;
      res.redirect('/signup')
    }
    } catch (error) {
      next(error);
    }
   
  },
  
  renderProfile: async (req, res, next) => {
    try {
       userData = await usersModel.findOne({ _id: req.session.userId._id }).lean();
    addressData = await addressModel.find({ userId: req.session.userId._id }).lean();
    orderDatas = await orderModel.find({ userId: req.session.userId._id }).populate('products.productId').lean();
    let cancel;
   cancel= orderDatas.map((i) => {
     if (orderDatas.orderStatus == 'cancelled')
       return cancel = true;
     cancel = false;
    })
    
    res.render("user/profile", { userheader:true,userData,addressData,orderDatas,cancel});
    } catch (error) {
      next(error);
    }
   
  },
  renderProductPage: async (req, res, next) => {
    try {
       id = req.params.id;
    productData = await productModel.findOne({ _id: id }).lean();
    productDatas = await productModel.find().lean();
    
    res.render('user/productDetails',{userheader:true,productData,productDatas});
    } catch (error) {
      next(error);
    }
   
  },
  renderShop: async (req, res, next) => {
    try {
        categoryData = await categoryModel.find().lean();
    productData = await productModel.find().lean();
    res.render('user/shop',{userheader:true,productData,categoryData});  
    } catch (error) {
      next(error); 
    }

  },
  renderCategoryPage: async (req, res, next) => {
    try {
       id = req.params.id;
    productData = await productModel.find({ category: id }).lean();
    categoryData = await categoryModel.find().lean();
    res.render('user/categoryPage', { productData ,categoryData});
    } catch (error) {
      next(error);
    }
   
  },
  logout: (req, res, next) => {
    try {
      delete req.session.userLogin;
      res.redirect('/');
    } catch (error) {
      next(error); 
    }
   
  }

};

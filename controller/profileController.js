var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var usersModel = require("../model/userSchema");
var categoryModel = require("../model/categorySchema")
var productModel = require('../model/productSchema');
var adminModel = require('../model/adminSchema');
var addressModel = require('../model/addressSchema');
const orderModel=require('../model/orderSchema')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const otp=require('./otp');
var session = require('express-session');
const bcrypt = require("bcrypt");

module.exports = {
    addAddress: async (req, res, next) => {
        try {
             userId = req.session.userId._id
       
        req.body.userId = userId;
        await addressModel.create(req.body);
        res.json({message:"success"});  
        } catch (error) {
            next(error);   
        }
     
        
    },
    
    editUserData: async (req, res, next) => {
        try {
             id = req.session.userId._id
        
        if(req.body.first_name) {
            updateData = await usersModel.findOneAndUpdate({ _id: id }, { $set: { first_name: req.body.first_name} }); 
        }
        if (req.body.last_name) {
            updateData = await usersModel.findOneAndUpdate({ _id: id }, { $set: { last_name: req.body.last_name } });
        }
        if (req.body.phone_number) {
            //need change to default value phone Number
          
            req.body.phone_number = Number(req.body.phone_number);
            req.session.changeNumber = req.body;
             await otp.doSms(req.body); 
            
            
         return res.render('user/otp',{id});
            
        
        }
     
        res.redirect('/user_profile');
        } catch (error) {
            next(error); 
        }
       
    },
    deleteAddress: async (req, res, next) => {
       
        try {
             await addressModel.findOneAndDelete({ _id: req.params.id });
        res.redirect('/user_profile');
        } catch (error) {
            next(error);    
        }
       
    },
    cancelOrder: async (req, res, next) => {
        try {
            await orderModel.findOneAndUpdate({ _id: req.body.orderId }, { orderStatus: 'cancelled' });
        res.json({ message: 'successfull' });
        } catch (error) {
            next(error);    
        }
        
    },
    changePassword: async (req, res, next) => {
       try {
          if (req.body.newPassword != req.body.confirmPassword)
            return res.json({ message: 'passwords not equal' });
        userData = await usersModel.findOne({ _id: req.session.userId }, { password: 1, _id: 0 }).lean();
       
        correct = await bcrypt.compare(req.body.oldPassword, userData.password)
        if (!correct)
            return res.json({ message: "failed" });
           password=await bcrypt.hash(req.body.newPassword, 12);
        await usersModel.findOneAndUpdate({ _id: req.session.userId }, { password: password });
        return res.json({ message: 'success' });
       } catch (error) {
        next(error); 
       }
      
    },
    editAddress: async(req, res, next) => {
        try {
          if (req.body.landMark == 'null'){
        await addressModel.findOneAndUpdate({ userId: req.session.userId, _id: req.session.addressId },{$set:{firstName:req.body.firstName,lastName:req.body.lastName,phoneNumber:req.body.phoneNumber,alternatePhoneNumber:req.body.alternatePhoneNumber,type:req.body.type,address:req.body.address1,city:req.body.city,state:req.body.state,pincode:req.body.pincode}});
    }
        if (req.body.alternatePhoneNumber == 'null'){
        await addressModel.findOneAndUpdate({ userId: req.session.userId, _id: req.session.addressId },{$set:{firstName:req.body.firstName,lastName:req.body.lastName,phoneNumber:req.body.phoneNumber,type:req.body.type,address:req.body.address1,city:req.body.city,state:req.body.state,landMark:req.body.landMark,pincode:req.body.pincode}});
        }
        else{
        await addressModel.findOneAndUpdate({ userId: req.session.userId, _id: req.session.addressId },{$set:{firstName:req.body.firstName,lastName:req.body.lastName,phoneNumber:req.body.phoneNumber,alternatePhoneNumber:req.body.alternatePhoneNumber,type:req.body.type,address:req.body.address1,city:req.body.city,state:req.body.state,landMark:req.body.landMark,pincode:req.body.pincode}});
    
        }
        res.json({message:"success"})   
        } catch (error) {
            next(error);   
        }
       
    }
    



}

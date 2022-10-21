var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const usersModel = require("../model/userSchema");
const categoryModel = require("../model/categorySchema")
const productModel = require('../model/productSchema');
const adminModel = require('../model/adminSchema');
const orderModel = require('../model/orderSchema');
const couponModel = require('../model/couponSchema');
const bannerModel = require('../model/bannerSchema');
const fs = require('fs');
const path = require('path');
var session = require('express-session');
const bcrypt = require("bcrypt");
const { findOneAndUpdate } = require("../model/userSchema");
const admin = require("../model/adminSchema");


module.exports = {

  //---------------------------------------------------admin login ----------------------------------------------------------
   
    loginPage: (req, res, next) => {
      
             let adminLogin
        if (req.session.adminLogin)
            return res.redirect('/admin/dashboard');
        if (req.session.loginError) {
            adminLogin = true;
            delete req.session.loginError
            
        }
          
        res.render('admin/adminSignIn',{layout:"admin_layout",adminLogin});
        
       
    },

    login: async (req, res, next) => {
       
              var correct;
        const { email, password } = req.body;
 
        const admin = await adminModel.findOne({ "email": email }).lean();
        if(admin)
        correct = await bcrypt.compare(password, admin.password)
        if (email == 'admin@gmail.com' && correct) {
            
            req.session.adminLogin = true;
           
            res.redirect('/admin/dashboard');
        }
        else {
            req.session.loginError = true;
            res.redirect( '/admin');
        }
        
      
    },

  //-------------------------------------------------admin dashboard-------------------------------------------------------------
    dashboard: async (req, res, next) => {
        
            res.render('admin/adminDashboard', { layout: "admin_layout" });
        
        
        
        
    },
    
    graphData: async (req, res, next) => {
        try {
             const eachDaySale = await orderModel.aggregate([{ $group: { _id: { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, total: { $sum: "$amountPaid" } } }]).sort({ _id: -1 })

        const monthlySales = await orderModel.aggregate([{ $group: { _id: { month: { $month: "$createdAt" } }, total: { $sum: "$amountPaid" } } }]).sort({ _id: -1 })
        const paymentType = await orderModel.aggregate([{ $group: { _id: { paymentType: "$paymentType" }, total: { $sum: "$amountPaid" } } }]).sort({ paymentType: 1 })
       
        graphData = { paymentType, monthlySales, eachDaySale }
        let paymentTotal = [];
        let monthlyTotal = [];
        paymentTotal[0] = paymentType[0].total;
        paymentTotal[1] = paymentType[1].total;
        let total;
        
        for (i = 0; i <= 11; i++){
            total = 0;
            for (j = 0; j <= monthlySales.length-1; j++){
                
                if (monthlySales[j]._id.month == (i + 1))
                    
                    total = total + monthlySales[j].total;    
            }
            monthlyTotal[i] = total;
        }
       
       
        res.json({ message: "success" ,paymentTotal,monthlyTotal});
        } catch (error) {
            console.log(error);
            next(error);  
        }
       
    },
   
    userData: async (req, res, next) => {
        try {
             const userdetails = await usersModel.find().lean();
        res.render('admin/usersTable',{layout:"admin_layout",userdetails})
        } catch (error) {
            
            next(error);  
        }
       
    },
    
    productData: async (req, res, next) => {
        try {
             const productData = await productModel.find().populate('category').lean();
     
        res.render('admin/productTable',{layout:"admin_layout",productData});
        } catch (error) {
            next(error);   
        }
       
    },

    orderData: async (req, res, next) => {
        try {
            orderData = await orderModel.find().populate("userId").populate("products.productId").lean(); 
            res.render('admin/orderDataTable',{orderData})
        } catch (error) {
            next(error); 
        }
        
    },

    couponData: async (req, res, next) => {
        try {
           couponData = await couponModel.find().lean();
        
        res.render('admin/couponTable',{couponData}) 
        } catch (error) {
            next(error);  
        }
        
    },

    bannerData: async (req, res, next) => {
        try {
              bannerData = await bannerModel.find().populate("productId").populate("categoryId").populate("couponId").lean();
        res.render('admin/bannerTable',{bannerData});
        } catch (error) {
            next(error); 
        }
      
    },

    
    categoryData: async (req, res, next) => {
        try {
             let categorydata = await categoryModel.find().lean();
        
        res.render('admin/categoryTable',{layout:"admin_layout",categorydata});
        } catch (error) {
            next(error);  
        }
       
    },

// --------------------------------------user block/unblock------------------------------------------------------------------------------------------

    userBlock: async (req, res, next) => {
         try {
               const userIds = req.body.id
        await usersModel.updateOne({_id:userIds}, { block : true });
        res.json({ message: 'success' });
         } catch (error) {
            next(error);
         }
     
        
    },
     
    userUnblock: async (req, res, next) => {
        try {
              const userIds = req.body.id
        await usersModel.updateOne({_id:userIds}, { block : false });
        res.json({ message: 'success' });
        } catch (error) {
            next(error);  
        }
      
        
    },
// -------------------------------category section--------------------------------------------------------------------------------------

    
    renderAddCategory: (req, res, next) => {
        try {
            res.render('admin/addCategory');
        } catch (error) {
            next(error);  
        }
         
    },
    
    addCategory: async (req, res, next) => {  
        try {
             let categorydata = await categoryModel.find().lean();
        categoryexist = categorydata.filter((i) => {
         if (i.category.toUpperCase() === req.body.category.toUpperCase())
                return true;
         })
        if (categoryexist[0]) {
            return res.send('category already exist');
        }
        await categoryModel.create(req.body);
        res.redirect('/admin/categoryData');
        } catch (error) {
            next(error);
        }
       
    },
  
    renderEditCategory: async (req, res, next) => {
        try {
              const categoryId = req.params.id;
        categoryData = await categoryModel.findOne({ _id: categoryId }).lean();
        res.render('admin/editCategory', {layout:"admin_layout",categoryData})
        } catch (error) {
            next(error);   
        }
      
    },

    editCategory: async (req, res, next) => {
        try {
            await categoryModel.findOneAndUpdate({ "_id": req.params.id }, { $set: { "category": req.body.category  } });
        res.redirect('/admin/categoryData');
        } catch (error) {
            next(error);  
        }
        
    },

    deletecategory: async (req, res, next) => {
        try {
              await categoryModel.deleteOne({ _id: req.params.id });
        res.redirect('/admin/categoryData');
        } catch (error) {
            next(error); 
        }
      
        
    },

   // ----------------------------------------product section-------------------------------------------------------------------
    
    
    renderAddProduct: async (req, res, next) => {
        try {
             const categorydata = await categoryModel.find().lean();
       
        res.render('admin/addProduct',{layout:"admin_layout",categorydata});
        } catch (error) {
            next(error);
        }
       
    },
    addProduct: async (req, res, next) => {
        try {
                 const productnames = await productModel.findOne({ name: req.body.name }).lean();
           
        if (productnames) 
            return res.send('product already exists');
       
        const arrImages = req.files.map((value) => value.filename);
        req.body.imagepath = arrImages;
        await productModel.create(req.body);
        res.redirect("/admin/productData");
        } catch (error) {
            next(error); 
        }
   

    },
  
    renderEditProduct: async (req, res, next) => {
        try {
               editId = req.params.id;
        productData = await productModel.findOne({ _id: editId }).populate('category').lean();
        const categoryData = await categoryModel.find().lean();
        res.render('admin/editProduct',{layout:"admin_layout",productData ,categoryData});
        } catch (error) {
            next(error); 
        }
     
    },

    editProduct: async (req, res, next) => {
        try {
              let arrImages = req.files.map((value) => value.filename);
        if (arrImages[0]) {
            imagepat = await productModel.findOne({ "_id": req.params.id }, { imagepath: 1, _id: 0 }).lean();
           
            imagepat.imagepath.map(( i) => fs.unlinkSync(path.join(__dirname, '..', 'public', 'product_uploads', i)))
            req.body.imagepath = arrImages;
            await productModel.findOneAndUpdate({ "_id": req.params.id }, { $set: { "name": req.body.name , "brandName": req.body.brandName,'description':req.body.description,'category':req.body.category,'stock':req.body.stock,'amount':req.body.amount,'discount':req.body.discount,'imagepath':req.body.imagepath} });
        }
        else {
            await productModel.findOneAndUpdate({ "_id": req.params.id }, { $set: { "name": req.body.name , "brandName": req.body.brandName,'description':req.body.description,'category':req.body.category,'stock':req.body.stock,'amount':req.body.amount,'discount':req.body.discount} });
        }
        res.redirect('/admin/productData');
        } catch (error) {
            next(error); 
        }
            
    },

    deleteProduct: async (req, res, next) => {
        try {
              imagepat = await productModel.findOne({ "_id": req.params.id }, { imagepath: 1, _id: 0 });
        imagepat.imagepath.map((i) => fs.unlinkSync(path.join(__dirname, '..', 'public', 'product_uploads', i)));
        await productModel.findOneAndDelete({ "_id": req.params.id }, { $set: { "name": req.body.name , "brandName": req.body.brandName,'description':req.body.description,'category':req.body.category,'stock':req.body.stock,'amount':req.body.amount,'discount':req.body.discount,'imagepath':req.body.imagepath} });
        res.redirect('/admin/productData'); 
        } catch (error) {
            next(error);  
        }
      
    },
//  ----------------------------------------------coupon section------------------------------------------------------------------------------------------
    
    
    renderAddCoupon: (req, res, next) => {
        try {
            res.render('admin/addCoupon');
        } catch (error) {
            next(error); 
        }
        
    },

    addCoupon: async (req, res, next) => {
        try {
                  couponNameExist = await couponModel.find({ couponName: req.body.couponName }).lean();
       couponIdExist = await couponModel.find({ couponCode: req.body.couponCode }).lean();
        if(couponNameExist[0] || couponIdExist[0])
        return res.json({ message: "couponExist" });
        await couponModel.create(req.body);
        res.redirect('/admin/couponData');
        } catch (error) {
            next(error);
        }
 
    },
  
    renderEditCoupon: async (req, res, next) => {
        try {
             id = req.params.id
        couponData = await couponModel.find({ _id: req.params.id }).lean();
        couponData[0].expiryDate = couponData[0].expiryDate.toISOString().substring(0, 10);
        couponData = couponData[0];
        res.render('admin/editCoupon', { id, couponData});
        } catch (error) {
            next(error);
        }
       
        
    },

    editCoupon: async (req, res, next) => {
        try {
            await couponModel.findOneAndUpdate({ _id: req.params.id }, { $set: { couponName:req.body.couponName,discountAmount:req.body.discountAmount,minAmount:req.body.minAmount,expiryDate:req.body.expiryDate,couponCode:req.body.couponCode} })
        res.redirect('/admin/couponData');
        } catch (error) {
            next(error); 
        }
        
    },

    deleteCoupon: async (req, res, next) => {
        try {
             await couponModel.deleteOne({ _id: req.params.id });
        res.redirect('/admin/couponData');
        } catch (error) {
            next(error); 
        }
       
        
    },

// -----------------------------------------------------order section---------------------------------------------------------------------------------------


    renderEditOrderStatus: async (req, res, next) => {
        try {
            id = req.params.id;
        var delivered, ordered, confirmed, shipped, cancelled;
        orderData = await orderModel.findOne({ _id: id }, { orderStatus: 1, _id: 1 }).lean();
        if (orderData.orderStatus == "Delivered"){
            delivered = true;
        }
        else if (orderData.orderStatus == "Ordered"){
            ordered = true;
        }
        else if (orderData.orderStatus == "Confirmed"){
            confirmed = true;
        }
        else if (orderData.orderStatus == "Shipped") {
            shipped = true;   
        }
        else if (orderData.orderStatus == "Cancelled") {
            cancelled = true;
        }
    
        res.render('admin/editOrderStatus',{id,delivered,ordered,confirmed,shipped,cancelled}); 
        } catch (error) {
            next(error); 
        }
         
    },
    editOrderStatus: async (req, res, next) => {
        try {
            await orderModel.findOneAndUpdate({ _id: req.params.id }, { orderStatus: req.body.productStatus });
        res.redirect('/admin/orderData');
        
        } catch (error) {
            next(error); 
        }
        
    },
    
//   -------------------------------------------------banner section-------------------------------------------------------------------------------------------------------  
   
    
    renderAddBanner: async (req, res, next) => {
        try {
             productData = await productModel.find().lean();
        res.render('admin/addBanner',{productData});
        } catch (error) {
            next(error); 
        }
       
    },
    addBanner: async(req, res, next) => {
        try {
            
             if (req.body.productId == "null") {
        delete req.body.productId
            }
            console.log(req.body);
        req.body.image = req.file.filename;
        await bannerModel.create(req.body);
        res.redirect('/admin/bannerData');
        } catch (error) {
            console.log("err", error)
            next(error);
        }
       
        
    },
  
    renderEditBanner: async (req, res, next) => {
        try {
              id = req.params.id;
        bannerData = await bannerModel.findOne({ _id: req.params.id }).populate('productId').lean();
        var productData,productExist
        if (bannerData.productId) {
            productData = await productModel.find().lean();
            productExist = true;
        }
        res.render('admin/editBanner', { bannerData, productData, productExist ,id});
        } catch (error) {
            next(error);  
        }
      
    },

    editBanner: async(req, res, next) => {
        try {
            console.log(req.body);
            if (req.file){
        imagePath= await bannerModel.findOne({ _id: req.params.id }, { _id: 0, image: 1 });
            fs.unlinkSync(path.join(__dirname, '..', 'public', 'images', 'bannerImages', imagePath.image));
            req.body.image = req.file.filename;
            await bannerModel.findOneAndUpdate({ _id: req.params.id }, { image: req.body.image });
        }
        if (req.body.productId == 'null') {
            delete req.body.productId
            await bannerModel.updateOne({ _id: req.params.id }, { $unset: { productId:"" } });
        }
        else if (req.body.productId) {
            
            await bannerModel.findOneAndUpdate({ _id: req.params.id }, {  productId: req.body.productId });
        }
        if(req.body.heading)
            await bannerModel.findOneAndUpdate({ _id: req.params.id }, { heading: req.body.heading });
        if(req.body.description)
            await bannerModel.findOneAndUpdate({ _id: req.params.id }, { description: req.body.description });
         res.redirect('/admin/bannerData'); 
        } catch (error) {
            next(error);
        }
       
      
    },

    deleteBanner: async (req, res, next) => {
        try {
              imagePath= await bannerModel.findOne({ _id: req.params.id }, { _id: 0, image: 1 });
        fs.unlinkSync(path.join(__dirname, '..', 'public', 'images', 'bannerImages', imagePath.image));
        await bannerModel.findOneAndDelete({ _id: req.params.id });
        res.redirect('/admin/bannerData');
        } catch (error) {
            next(error);  
        }
      
    },
    logout: (req, res, next) => {
        try {
            delete req.session.adminLogin,
            res.redirect('/admin');
        } catch (error) {
            next(error);
        }
        
    },
    

//--------------------------------------render error page-----------------------------------------------------------
    
    errorCreate: (req, res, next) => {
        next(createError(404));
    },
    errorPage:(err, req, res, next) =>{
        console.log("admin error route handler")
          res.status(err.status || 500);
          adminError = true;
        res.render('error', {adminError });
      }
    
      
}
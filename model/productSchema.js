const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
       type:String
    },
    brandName: {
        type:String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category'
    },
    description: { 
        type:String
    },
    stock: {
        type:Number
    },
    amount: {
        type:Number
    },
    discount: {
        type:Number
    },
    imagepath: {
        type:Array
    },
    
},
{timestamps:true})
const product=mongoose.model('Products',productSchema)
module.exports = product;
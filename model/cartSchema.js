const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
        // required:true
    },
   
    products: [
       {
        productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Products'
        },
       quantity: {
           type: Number,
           
            },
            price: {
                type: Number,
                default:0
           }
      
        }
       
]
   
    
    
}, {timestamps:true});
const cart = mongoose.model("Cart", cartSchema);
module.exports = cart;
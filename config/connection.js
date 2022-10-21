const mongoose = require("mongoose");
const mongoose_connect=process.env.MONGO_CONNECTION_ID
mongoose.connect(mongoose_connect, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, (err) => {
    if (err) return console.log('err connection', err);
    console.log('database connected');
})


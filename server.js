const express = require("express")
const cors = require('cors')
require('dotenv').config();
const app = express()
const mongoURI = process.env.MONGO_URI
const mongoose = require("mongoose");
const PORT = 5000
const apiRoutes = require('./routes/apiRoutes')
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }))


async function connectTOMongoDB(uri){
    try{
        await mongoose.connect(uri);
        console.log('Connected To DB');
    }
    catch(err){
        console.log(err.message);
    }
}

connectTOMongoDB(mongoURI)

app.get("/",(req,res)=>{
    res.send("All is well!")
} );
app.use("/api",apiRoutes);




app.listen(PORT, () => {
    console.log("Server is running at", PORT);
});
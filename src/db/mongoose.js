// nodejs code demonstrating usage of the ODM mongoose
const mongoose = require('mongoose');
const dbName = process.env.DB_NAME;
const dbConnString = process.env.DB_PATH + dbName;
// Connect to database
mongoose.connect(dbConnString, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});
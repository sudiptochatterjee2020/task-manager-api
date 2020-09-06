// nodejs code demonstrating usage of the ODM mongoose
const mongoose = require('mongoose');
const dbConnString = process.env.DB_CONN_STRING;
// Connect to database
mongoose.connect(dbConnString, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});
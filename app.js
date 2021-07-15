if(process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('./models/campground');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utilities/ExpressError');
const { STATUS_CODES } = require('http');
const {campgroundSchema, reviewSchema} = require('./schemas.js');
const Review = require('./models/review');
const session = require("express-session");
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campground');
const reviewRoutes = require('./routes/review');
const mongoSanitize = require('express-mongo-sanitize');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
const MongoDBStore = require("connect-mongo");


mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

const db = mongoose.connection;
db.on("error", console.error.bind(console,"connection error:"));
db.once("open", () => {
    console.log("Database connected");
})

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));


const secret = process.env.SECRET || 'thisshouldbeabettersecret';
const store = new MongoDBStore({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24*60*60
})

store.on("error", function(e){
    console.log("Session stroe error", e)
})

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        exprires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize({
    replaceWith: '_'
}));
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/fakeUser', async(req, res) => {
    const user = new User({ email: 'aaaaa@gmail.com', username: 'aaaaa'})
    const newUser = await user.register(user,'hereinputthepassword');
})

app.use("/",userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);


app.get('/', (req, res) => {
    res.render('home');
})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})
app.use((err, req, res, next) => {
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Oh No, Something Went Wrong';
    res.status(statusCode).render('error', {err});
})
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
})





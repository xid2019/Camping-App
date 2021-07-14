const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp',{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console,"connection error:"));
db.once("open", () => {
    console.log("Database connected");
})

const sample = (array) => array[Math.floor(Math.random()*array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++){
        const random1000 = Math.floor(Math.random()*1000)
        const price = Math.floor(Math.random()*20)+20;
        const camp = new Campground({
            author:'60e75b88282d722292dd2dfd',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem',
            price,
            geometry: {
                type:"Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dm35sdhkt/image/upload/v1626059819/YelpCamp/g0a5efmbh5welwgjhqky.jpg',
                    filename: 'YelpCamp/g0a5efmbh5welwgjhqky'
                  },
                  {
                    url: 'https://res.cloudinary.com/dm35sdhkt/image/upload/v1626059819/YelpCamp/iernud4kkaemmv1y3j3u.jpg',
                    filename: 'YelpCamp/iernud4kkaemmv1y3j3u'
                  }
            ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
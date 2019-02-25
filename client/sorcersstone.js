const client = require("./clientMethods.js");

console.log("I am going to checkout out Harry Potter and the Sorcerer's Stone");
client.CheckoutBook({
  "title": "Harry Potter and the Sorcerer's Stone",
  "author": "J.K. Rowling",
  "genre": "Fantasy",
  "id": 1,
  "isAvailable": true,
  "isReserved": false
});
setTimeout(() => {
  console.log("I am going to see if Sorcerer's Stone is available");
  client.CheckAvailibilty(
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "genre": "Fantasy",
        "id": 1,
        "isAvailable": true,
        "isReserved": false
    });
}, 2000);



//config .env
require("dotenv").config();

// acquriring packages
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");

//using ejs templates
app.set("view engine", "ejs");

//using bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

// using static files rendered automatically
app.use(express.static(__dirname + "/public"));

//listening to port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server is up and running");
});

//connecting to db
mongoose.connect("mongodb+srv://" + process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD + "@cluster0.j0bhk.mongodb.net/" + process.env.DB_NAME, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//itemSchema
const itemsSchema = {
  name: {
    type: String,
    required: true
  }
};

//dynamic listschema
const listSchema = {
  name: String,
  items: [itemsSchema],
};

//creating model for itemSchema
const Item = mongoose.model("item", itemsSchema);

//creating model for listschema
const List = mongoose.model("list", listSchema);

//creating default items
const item1 = new Item({
  name: "Eat",
});
const item2 = new Item({
  name: "Sleep",
});
const item3 = new Item({
  name: "Code",
});
const item4 = new Item({
  name: "Repeat",
});
const defaultItems = [item1, item2, item3, item4];


//rendering default list
app.get("/", function(req, res) {
  //finding docs
  Item.find(function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      if (docs.length === 0) {
        // Inserting default items in items db
        Item.insertMany(defaultItems,
          function(err) {
            if (err)
              console.log(err);
            else {
              console.log("Items added Successfully to db");
            }
          }
        );
        //redirecting to home route to display default items
        res.redirect("/");
      } else {
        //sending dynamic contents from items db
        res.render("list", {
          listRoute: "/",
          listTitle: "Today",
          items: docs,
        });
      }
    }
  });
});

//adding new item to default list
app.post("/", function(req, res) {
  let newItemName = req.body.nextItem;
  let listName = req.body.button;
  //creating new item obj
  let newItem = new Item({
    name: newItemName,
  });
  //saving item and re-rendering
  newItem.save();
  res.redirect("/");
});

//deleting item from default list
app.post("/delete", function(req, res) {
  const deleteDataId = req.body.checkedDataId;
  //finding doc
  Item.findByIdAndDelete(deleteDataId, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Item Successfully deleted.");
    }
  })
  //redirecting to diplay changes
  res.redirect("/");
});


//creating and rendering custom list
app.get("/lists/:customListName/", function(req, res) {
  let listName = _.capitalize(req.params.customListName);
  ///check if list already exist
  List.findOne({
    name: listName
  }, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      //creating list
      if (!doc) {
        const newList = new List({
          name: listName,
          items: defaultItems,
        });
        newList.save();
        //redirecting to access newly created doc
        res.redirect("/lists/" + listName);
      }
      //rendering list with default items
      else {
        res.render("list", {
          listRoute: "/lists/" + listName + "/",
          listTitle: doc.name,
          items: doc.items,
        });
      }
    }
  });
});

//adding new item to custom list
app.post("/lists/:customListName/", function(req, res) {
  let newItemName = req.body.nextItem;
  let listName = req.body.button;
  //creating new item
  let newItem = new Item({
    name: newItemName,
  });
  //finding custom list
  List.findOne({
    name: listName
  }, function(err, foundList) {
    if (err)
      console.log(err);
    else {
      // adding new item
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/lists/" + listName + "/");
    }
  });
});

//deleting item from custom list
app.post("/lists/:customListName/delete", function(req, res) {
  let listName = req.body.listName;
  let deleteDataId = req.body.checkedDataId;
  //finding custom list and update
  List.findOneAndUpdate({
      name: listName
    },
    //mongodb code to delete element from array
    {
      $pull: {
        items: {
          _id: deleteDataId
        }
      }
    },
    function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item Successfully deleted");
        res.redirect("/lists/" + listName + "/");
      }
    }
  )
});

//rendering about page
app.get("/about", function(req, res) {
  res.render("about");
});

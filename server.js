/*********************************************************************************
* WEB322 – Assignment 05
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
* assignment has been copied manually or electronically from any other source (including web sites) or
* distributed to other students.
*
* Name: Steven Tran Student ID: 105629174 Date: March 22nd, 2019
*
* Online (Heroku) Link: https://weba5.herokuapp.com/
*
********************************************************************************/ 

const express = require('express');
const app = express();
const path = require('path');
const data = require('./data-service.js');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const uploadedImagesPath = "./public/images/uploaded";

app.engine('.hbs', exphbs(


    {
        extname: '.hbs',
        defaultLayout: 'main',
        helpers: {

            navLink: function (url, options) {

                return '<li' +
                    ((url == app.locals.activeRoute) ? ' class="active" ' : '') +

                    '><a href="' + url + '">' + options.fn(this) + '</a></li>';
            },

            equal: function (lvalue, rvalue, options) {

                if (arguments.length < 3)
                    throw new Error("Handlebars Helper equal needs 2 parameters");
                if (lvalue != rvalue) {
                    return options.inverse(this);
                } else {
                    return options.fn(this);
                }
            }
        }
    }

));

app.set('view engine', '.hbs');

app.use((req, res, next) => {

    let route = `${req.baseUrl}${req.path}`;

    if (route == '/') {
        app.locals.activeRoute = '/';
    } else {
        app.locals.activeRoute = route.replace(/\/$/, '');
    }

    next();

});


//const employeesJSON = require('./data/employees.json'); no longer needed because data-service module took care of reading the file contents and putting it into an array of objects. 
//const departmentsJSON = require('./data/departments.json'); no longer needed because data-service module took care of reading the file contents and putting it into an array of objects. 

const http_port = process.env.PORT || 8080;

app.use(express.static('public'));


// middleware to process normal http post form data 
app.use(bodyParser.urlencoded({
    extended: true
}));



// sets up a storage for images in the uploaded folder when an image is uploaded on the site. 
const storage = multer.diskStorage(

    {
        destination: "./public/images/uploaded",

        filename: function (req, file, cb) {

            cb(null, `${Date.now()}${path.extname(file.originalname)}`);
        }
    }
);


// this upload object has a storage property, for middleware use.
const upload = multer(

    {
        storage: storage
    }

);


// uploads image and redirects to the images route. upload.single() processes the file upload in form, the imageFIle is value of name attribute in form for file input element.  
app.post("/images/add", upload.single("imageFile"), (req, res) => {

    res.redirect("/images");
});


app.post("/employees/add", (req, res) => {

    data.addEmployee(req.body).then(() => {

        res.redirect("/employees");
    }).catch((err) => {

        res.json({ message: err });
    });

});

app.post("/employee/update", (req, res) => {

    //console.log(req.body);

    data.updateEmployee(req.body)
        .then(() => {
            res.redirect("/employees");
        })
        .catch((err) => {
            res.json({
                message: err
            })
        });


});


app.get("/employees/add", (req, res) => {

    //res.sendFile(path.join(`${__dirname}/views/addEmployee.html`));
    //res.render('addEmployee.hbs');

    data.getDepartments()
        .then((data) => {
            res.render("addEmployee.hbs", {  departments: data }); })
        .catch(() => {
            res.render("addEmployee.hbs", { departments: [] }); });


});


app.get("/images/add", (req, res) => {

    // res.sendFile(path.join(`${__dirname}/views/addImage.html`))
    res.render('addImage.hbs');
});


app.get("/images", (req, res) => { // when in the /images route, it will read the directory of the uploaded images folder and display each image data in JSON format. 

    fs.readdir(uploadedImagesPath, (err, uploadedImages) => {

        if (err) {
            res.json({
                message: err
            });
        }

        res.render('images.hbs', {
            images: uploadedImages
        });

    });

});


app.get("/", (req, res) => {

    //res.sendFile(path.join(`${__dirname}/views/home.html`));
    res.render('home.hbs');
});



app.get("/about", (req, res) => {

    //res.sendFile(path.join(`${__dirname}/views/about.html`));
    res.render('about.hbs');
});

app.get("/employees", (req, res) => {

    if (req.query.status) {

        data.getEmployeesByStatus(req.query.status)
            .then((statusData) => {
                if (statusData.length > 0)
                res.render('employees.hbs', {
                    employees: statusData
                });
                else
                res.render('employees.hbs', {
                    message: "no results"
                });
            })
            .catch((err) => {
                res.render('employees.hbs', {
                    message: err
                });
            });
    } else if (req.query.department) {

        data.getEmployeesByDepartment(req.query.department)
            .then((departmentData) => {
                if (departmentData.length > 0)
                res.render('employees.hbs', {
                    employees: departmentData
                });
                else
                res.render('employees.hbs', {
                    message: "no results"
                });
            })
            .catch((err) => {
                res.render('employees.hbs', {
                    message: err
                });
            });
    } else if (req.query.manager) {

        data.getEmployeesByManager(req.query.manager)
            .then((managerData) => {
                if (managerData.length > 0)
                res.render('employees.hbs', {
                    employees: managerData
                });
                else
                res.render('employees.hbs', {
                    message: "no results"
                });
            })
            .catch((err) => {
                res.render('employees.hbs', {
                    message: err
                });
            });
    } else {                                         

        data.getAllEmployees()
            .then((data) => {
                if (data.length > 0)
                    res.render('employees.hbs', {
                        employees: data
                    });
                else
                    res.render('employees.hbs', {
                        message: "no results"
                    });

            })
            .catch((err) => {
                res.render('employees.hbs', {
                    message: err
                });
            });
    }
});

app.get("/employee/:num", (req, res) => {

    // initialize an empty object to store the values
    let viewData = {};
    data.getEmployeeByNum(req.params.num).then((data) => {
            if (data) {
                viewData.employee = data; //store employee data in the "viewData" object as "employee"
            } else {
                viewData.employee = null; // set employee to null if none were returned
            }
        }).catch(() => {
            viewData.employee = null; // set employee to null if there was an error
        }).then(data.getDepartments)
        .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments"
            // loop through viewData.departments and once we have found the departmentId that matches
            // the employee's "department" value, add a "selected" property to the matching
            // viewData.departments object
            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
        }).catch(() => {
            viewData.departments = []; // set departments to empty if there was an error
        }).then(() => {
            if (viewData.employee == null) { // if no employee - return an error
                res.status(404).send("Employee Not Found");
            } else {
                res.render("employee", {
                    viewData: viewData
                }); // render the "employee" view
            }
        });
});
//});

app.get("/managers", (req, res) => {

    data.getManagers()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.json({
                message: err
            });
        });
});

app.get("/departments", (req, res) => {

    data.getDepartments()
        .then((data) => {
            if (data.length > 0)
                res.render('departments.hbs', { departments: data});
            else
                res.render('departments.hbs', { message: "no results" }); 
        })
        .catch((err) => {
            res.render('departments.hbs', { message: err  });
        });

});

app.get("/departments/add", (req, res) => {

    res.render("addDepartment.hbs");
});


app.post('/departments/add', (req, res) => {
    data.addDepartment(req.body)
        .then(res.redirect('/departments'))
        .catch((err) => res.json({ message: err }));
})
 
app.post("/department/update", (req, res) => {
    data.updateDepartment(req.body)
        .then(res.redirect('/departments'))
        .catch((err) => res.json({  message: err  }));
});

app.get('/department/:departmentId', (req, res) => {
    
    data.getDepartmentById(req.params.departmentId)
        .then((data) => {
            if (data.length > 0)
                res.render("department", { department: data});         
            else
                res.status(404).send("Department Not Found");
        })
        .catch(() => {
            res.status(404).send("Department Not Found");                    
        })
});





app.get('/employees/delete/:empNum', (req, res) => {
    data.deleteEmployeeByNum(req.params.empNum)
        .then((data) => {
            res.redirect("/employees");
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Employee / Employee not found");
        });
})




app.use((req, res) => { // if route doesn't match anything above, do this.

    res.status(404).send(`
    
    <div style='display: flex; justify-content: center; align-items: center; height: 100%;'>
    
    <img src='https://cdn-images-1.medium.com/max/640/1*PayLNtfwPr4hIicJtwvVLA.png' alt='404img'>
    
    </div>
     
    
    `);

});

data.initialize().then((data) => {

    app.listen(http_port, function () {
        console.log(data);
        console.log(`Express http server listening on port ${http_port}....`);
    });

}).catch((err) => {
    console.log(err);
});
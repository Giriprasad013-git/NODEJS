const express = require('express');
const fs = require('fs');
const cron = require('node-cron')
const router = express.Router();
const path = require('path')
const mysql = require('mysql');
const { format } = require('date-fns')

const db = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: 'root',
    database: 'apartment_management_system'
})
db.commit();

//function used to add new month bills
function updateallbills(req, res) {
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) res.status(400).json({ error: "somthing went wrong in reading flats" });

        result.forEach(hii => {
            const gasbill = 200;
            const maintenencebill = 300;
            const garbagebill = 400;

            const query = `INSERT INTO bills (date, flatid, gasbill, maintenencebill, garbagebill) VALUES ("${format(new Date(), 'yyyy-MM-dd')}", "${hii.id}", "${gasbill}", "${maintenencebill}", "${garbagebill}")`;

            db.query(query, (error, results) => {
                if (error) {
                    console.error('Error inserting data:', error);
                    // Handle the error and send an appropriate response
                    res.status(500).json({ error: 'An error occurred while updating bills.' });
                }
            });
        });
    });
    // Send a success response
    res.json({ message: 'Bills updated successfully.' });
}


//function used to update flat bills in flat file
function updateflatbills(req, res) {
    const sql = "select * from flats";
    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "something went wrong in reading flats" });

        const updatePromises = result.map(data => {
            const gasbill = 200;
            const maintenencebill = 300;
            const garbagebill = 400;

            const gasBill = data.gasbill + gasbill;
            const maintenenceBill = data.maintenencebill + maintenencebill;
            const garbageBill = data.garbagecollectionbill + garbagebill;

            const sql2 = `update flats set gasbill=${gasBill},maintenencebill=${maintenenceBill},garbagecollectionbill=${garbageBill} where flats.id="${data.id}"`;

            return new Promise((resolve, reject) => {
                db.query(sql2, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });
        });

        Promise.all(updatePromises)
            .then(() => {
                res.status(200).json({ message: 'flat bills updated successfully' });
            })
            .catch(error => {
                res.status(500).json({ error: 'something went wrong in updating flats table' });
            });
    });
}


//used to update all the bills one time if 1 month completed
cron.schedule('0 0 1 * *', (req, res) => {
    const billData = readBillsFile();
    const currentMonthdata = billData.find((data) => Object.keys(data)[0] === currentDate)
    if (currentMonthdata) {
        console.log(`Bills for this ${currentDate} month is alredy exist, update skipping`)
    }
    if (!currentMonthdata) {
        updateallbills(req, res);
        updateflatbills(req, res);
    }
})

//returns the bills monthly for an id
router.get('/monthlyflatbill/:id/date/:date', (req, res) => {
    const { id, date } = req.params;
    if (!id || !date) {
        return res.status(400).json({ error: "flat bill didn't found" })
    }
    const sql = `select * from bills where date="${date}" and flatid="${id}"`

    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "something went wrong in reading flats" });

        if (!result) {
            return res.status(404).json({ error: "Bills data not found for the date and flat" })
        }
        res.json(result);
    })
})

module.exports = router;
const express = require('express');
const fs = require('fs');
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


//returns the bills payments monthly for an id
router.get('/monthlyflatbillpayment/:id/date/:date', (req, res) => {
    const { id, date } = req.params;
    if (!id || !date) {
        return res.status(400).json({ error: "flat bill didn't found" })
    }
    const sql = `select * from billpayments where date="${date}" and flatid="${id}"`

    db.query(sql, (err, result) => {
        if (err) return res.status(400).json({ error: "something went wrong in reading billpayments data" });

        if (!result) {
            return res.status(404).json({ error: "Billpayments data not found for the date and flat" })
        }
        res.json(result);
    })
})

module.exports = router;